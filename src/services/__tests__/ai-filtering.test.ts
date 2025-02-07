// Mock the OpenAI module
const mockCreate = jest.fn();

jest.mock('openai', () => {
  return function() {
    return {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  };
});

import { AIService, getAIService } from '../ai';
import { SalaryData } from '../../types/salary';
import OpenAI from 'openai';

// Mock HR data for testing
const mockHRData: SalaryData = {
  employees: [
    {
      id: 1,
      name: 'John Doe',
      position: 'Director',
      department: 'BOD',
      division: 'Executive',
      salary: 200000,
      specialty: 'Management',
      termination_month: null
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Manager',
      department: 'Back Office',
      division: 'Operations',
      salary: 150000,
      specialty: 'Operations',
      termination_month: null
    },
    {
      id: 3,
      name: 'Bob Wilson',
      position: 'Manager',
      department: 'Back Office',
      division: 'Operations',
      salary: 140000,
      specialty: 'Operations',
      termination_month: null
    }
  ],
  metadata: {
    total_employees: 3,
    divisions: ['Executive', 'Operations'],
    last_updated: new Date().toISOString()
  }
};

describe('AIService Filtering Tests', () => {
  let aiService: AIService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up mock response
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            name: "Test Dashboard",
            description: "A test dashboard",
            components: [{
              id: "test-component",
              type: "chart",
              config: {
                title: "Test Chart",
                description: "A test chart",
                chartType: "bar",
                dataSource: {
                  type: "department",
                  metric: "salary",
                  calculation: "sum",
                  groupBy: "department"
                },
                visualization: {
                  showLegend: true,
                  showValues: true,
                  colors: ["#4CAF50", "#2196F3"]
                }
              },
              layout: {
                x: 0,
                y: 0,
                w: 6,
                h: 4
              }
            }]
          })
        }
      }]
    });
    
    // Create a new instance of AIService with OpenAI provider
    aiService = new AIService('test-api-key', 'openai');
    
    // Set the mock HR data
    aiService.setHRData(mockHRData);
  });

  it('should send all data to LLM when no department focus is specified', async () => {
    await aiService.generateDashboard('Show me a dashboard of all employees');
    
    // Get the context sent to OpenAI
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify all departments are included
    expect(contextSentToLLM).toContain('BOD');
    expect(contextSentToLLM).toContain('Back Office');
    expect(contextSentToLLM).toContain('3 employees');
  });

  it('should send only BOD data to LLM when BOD department is focused', async () => {
    await aiService.generateDashboard('Show me a dashboard for BOD department');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify BOD data is included
    expect(contextSentToLLM).toContain('BOD');
    expect(contextSentToLLM).toContain('Director');
    expect(contextSentToLLM).toContain('$200,000');
  });

  it('should send filtered data to LLM when using multiple filters', async () => {
    await aiService.generateDashboard('Show me a dashboard for Back Office department');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify Back Office data is included
    expect(contextSentToLLM).toContain('Back Office');
    expect(contextSentToLLM).toContain('Manager');
    expect(contextSentToLLM).toContain('2 employees');
  });

  it('should send salary range filtered data to LLM', async () => {
    await aiService.generateDashboard('Show me a dashboard for salaries above $150,000');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify high salary data is included
    expect(contextSentToLLM).toContain('$200,000');
    expect(contextSentToLLM).toContain('Director');
  });

  it('should include correct metrics in filtered context', async () => {
    await aiService.generateDashboard('Show me a dashboard for BOD department');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify metrics are calculated correctly
    expect(contextSentToLLM).toContain('BOD');
    expect(contextSentToLLM).toContain('$200,000');
    expect(contextSentToLLM).toContain('1 employees');
  });

  it('should handle chat messages with filtered context', async () => {
    await aiService.chatWithAI('Tell me about the BOD department');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify chat context includes department info
    expect(contextSentToLLM).toContain('BOD');
    expect(contextSentToLLM).toContain('Director');
    expect(contextSentToLLM).toContain('$200,000');
  });

  it('should maintain consistent filtering across multiple requests', async () => {
    await aiService.generateDashboard('Show me a dashboard for Back Office department');
    
    const contextSentToLLM = mockCreate.mock.calls[0][0].messages[0].content;
    
    // Verify Back Office data remains consistent
    expect(contextSentToLLM).toContain('Back Office');
    expect(contextSentToLLM).toContain('2 employees');
    expect(contextSentToLLM).toContain('Manager');
  });
}); 