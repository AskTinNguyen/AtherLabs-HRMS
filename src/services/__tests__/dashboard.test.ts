import '@testing-library/jest-dom';
import { DashboardService } from '../dashboardService';
import { AIService } from '../ai';
import { CustomDashboard } from '../../types/dashboard';
import { SalaryData } from '../../types/salary';

// Mock HR data
const mockHRData: SalaryData = {
  employees: [
    {
      id: 1,
      name: "John Doe",
      position: "Developer",
      specialty: "Frontend",
      department: "Engineering",
      division: "Product",
      salary: 100000,
      termination_month: null
    }
  ]
};

describe('Dashboard Service', () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Use local storage implementation for tests
    dashboardService = new DashboardService(true);
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('creates a new dashboard', async () => {
    const name = 'Test Dashboard';
    const description = 'Test Description';
    
    const dashboard = await dashboardService.createDashboard(name, description);
    
    expect(dashboard).toMatchObject({
      name,
      description,
      components: [],
      isAIGenerated: false
    });
    expect(dashboard.id).toBeDefined();
    expect(dashboard.createdAt).toBeInstanceOf(Date);
    expect(dashboard.updatedAt).toBeInstanceOf(Date);
  });

  test('lists all dashboards', async () => {
    await dashboardService.createDashboard('Dashboard 1', 'Description 1');
    await dashboardService.createDashboard('Dashboard 2', 'Description 2');
    
    const dashboards = await dashboardService.listDashboards();
    expect(dashboards).toHaveLength(2);
  });

  test('gets a dashboard by id', async () => {
    const created = await dashboardService.createDashboard('Test', 'Description');
    const retrieved = await dashboardService.getDashboard(created.id);
    
    expect(retrieved).toMatchObject(created);
  });

  test('updates a dashboard', async () => {
    const dashboard = await dashboardService.createDashboard('Original', 'Description');
    const updated: CustomDashboard = {
      ...dashboard,
      name: 'Updated'
    };
    
    await dashboardService.updateDashboard(updated);
    const retrieved = await dashboardService.getDashboard(dashboard.id);
    
    expect(retrieved?.name).toBe('Updated');
  });

  test('deletes a dashboard', async () => {
    const dashboard = await dashboardService.createDashboard('To Delete', 'Description');
    await dashboardService.deleteDashboard(dashboard.id);
    
    const retrieved = await dashboardService.getDashboard(dashboard.id);
    expect(retrieved).toBeNull();
  });
});

describe('AI Dashboard Generation', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    aiService = new AIService('test-api-key', true);
    aiService.setHRData(mockHRData);
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('generates a dashboard from prompt', async () => {
    const prompt = 'Create a salary distribution dashboard';
    const dashboard = await aiService.generateDashboard(prompt);
    
    expect(dashboard).toMatchObject({
      name: 'Generated Dashboard',
      description: 'AI Generated dashboard',
      isAIGenerated: true,
      components: []
    });
  });

  test('handles chat initialization correctly', async () => {
    const message = 'Test message';
    const response = await aiService.chatWithAI(message);
    expect(response).toBe('Mock response');
  });
}); 