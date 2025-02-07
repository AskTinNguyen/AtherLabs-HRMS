# Mock Implementations Guide

## Overview

This document provides detailed information about the mock implementations used in our test suite, focusing on the evolution of our mocking strategy and successful patterns.

## Evolution of Mocking Strategy

### 1. Initial Approach (Failed)
```typescript
// ❌ Direct fetch mocking - Led to issues
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

// ❌ Complex response mocking - Brittle tests
class MockResponse {
  ok: boolean;
  status: number;
  body: any;
  
  constructor(body: any) {
    this.ok = true;
    this.status = 200;
    this.body = body;
  }
}
```

### 2. Successful Approach
```typescript
// ✅ Module-level mocking
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor(apiKey: string) {}
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: async (message: string) => ({
            response: {
              text: async () => message.includes('INSTRUCTIONS') 
                ? 'HR Database loaded.' 
                : 'Mock response'
            }
          })
        })
      };
    }
  }
}));

// ✅ Storage Strategy Pattern
interface DashboardStorage {
  save(dashboard: CustomDashboard): Promise<void>;
  getAll(): Promise<CustomDashboard[]>;
  getById(id: string): Promise<CustomDashboard | null>;
  update(dashboard: CustomDashboard): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## Mock Objects

### Local Storage Mock
```typescript
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
```

### Gemini API Mock
```typescript
// Module mock instead of instance mock
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
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
}));
```

## Implementation Details

### Failed Patterns
1. **Instance-level Mocking**
   ```typescript
   // ❌ Don't do this
   const mockChat = {
     sendMessage: jest.fn().mockResolvedValue({
       response: { text: () => 'response' }
     })
   };
   ```

2. **Direct Property Access**
   ```typescript
   // ❌ Avoid this pattern
   global.fetch = jest.fn().mockReturnValue({
     ok: true,
     json: () => ({ data: [] })
   });
   ```

### Successful Patterns
1. **Module Mocking**
   ```typescript
   // ✅ Do this
   jest.mock('module-name', () => ({
     ExportedClass: class {
       method() { return mockValue; }
     }
   }));
   ```

2. **Strategy Pattern**
   ```typescript
   // ✅ Use interfaces and implementations
   class TestStorage implements DashboardStorage {
     private store = new Map();
     async save(item: any) { this.store.set(item.id, item); }
     async getAll() { return Array.from(this.store.values()); }
   }
   ```

## Best Practices

### 1. Mock Setup
- Use module-level mocking for external dependencies
- Implement storage strategies for data persistence
- Clear state between tests
- Use dependency injection

### 2. Response Structure
- Match API contracts exactly
- Use async/await consistently
- Handle error cases
- Maintain type safety

### 3. State Management
- Clear mocks before each test
- Reset storage state
- Avoid shared state
- Clean up after tests

## Common Issues and Solutions

### 1. Async Operations
```typescript
// ✅ Correct
async sendMessage() {
  return {
    response: {
      text: async () => 'response'
    }
  };
}

// ❌ Wrong
sendMessage: () => ({
  response: {
    text: 'response'
  }
})
```

### 2. Storage Operations
```typescript
// ✅ Correct
class TestStorage implements DashboardStorage {
  private store = new Map();
  
  async save(item: any) {
    this.store.set(item.id, item);
  }
}

// ❌ Wrong
const storage = {
  save: jest.fn(),
  getAll: jest.fn()
};
```

### 3. Error Handling
```typescript
// ✅ Correct
jest.mock('module', () => ({
  method: async () => {
    throw new Error('Expected error');
  }
}));

// ❌ Wrong
jest.fn().mockRejectedValue('error');
```

## Testing Guidelines

1. **Use Storage Strategy**
   - Implement storage interface
   - Use local storage for tests
   - Clear state between tests
   - Handle async operations

2. **Mock External Services**
   - Use module-level mocking
   - Match API contracts
   - Handle all response cases
   - Test error scenarios

3. **Maintain Test Independence**
   - Clear all mocks before each test
   - Reset storage state
   - Avoid shared state
   - Clean up resources 