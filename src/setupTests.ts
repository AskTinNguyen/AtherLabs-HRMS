import '@testing-library/jest-dom';

// Mock the internal makeRequest function from @google/generative-ai
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      constructor(apiKey: string) {}

      getGenerativeModel() {
        return {
          startChat: () => ({
            sendMessage: async (message: string) => ({
              response: {
                text: async () => message.includes('INSTRUCTIONS') ? 'HR Database loaded.' : 'Mock response'
              }
            }),
          }),
          generateContent: async () => ({
            response: {
              text: async () => JSON.stringify({
                name: 'Generated Dashboard',
                description: 'AI Generated dashboard',
                isAIGenerated: true,
                components: []
              })
            }
          })
        };
      }
    }
  };
});

// Mock fetch API
const createResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
};

// Store for mock dashboards
const mockDashboardStore = new Map();

global.fetch = jest.fn((url: string, options?: RequestInit) => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body as string) : null;

  switch (`${method} ${url}`) {
    case 'POST /api/dashboards':
      if (body) {
        mockDashboardStore.set(body.id, body);
        return Promise.resolve(createResponse({ success: true, data: body }));
      }
      return Promise.resolve(createResponse({ error: 'Invalid dashboard data' }, 400));

    case 'GET /api/dashboards':
      return Promise.resolve(createResponse({ 
        success: true, 
        dashboards: Array.from(mockDashboardStore.values()) 
      }));

    case 'PUT /api/dashboards':
      if (body && mockDashboardStore.has(body.id)) {
        mockDashboardStore.set(body.id, body);
        return Promise.resolve(createResponse({ success: true, data: body }));
      }
      return Promise.resolve(createResponse({ error: 'Dashboard not found' }, 404));

    case 'DELETE /api/dashboards':
      if (url.includes('id=') && mockDashboardStore.has(url.split('id=')[1])) {
        mockDashboardStore.delete(url.split('id=')[1]);
        return Promise.resolve(createResponse({ success: true }));
      }
      return Promise.resolve(createResponse({ error: 'Dashboard not found' }, 404));

    default:
      return Promise.resolve(createResponse({ success: true }));
  }
}) as jest.Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    length: 0,
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Clear mock stores between tests
beforeEach(() => {
  mockDashboardStore.clear();
  jest.clearAllMocks();
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock; 