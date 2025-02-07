import { AIService, getAIService } from '../ai';
import { SalaryData } from '../../types/salary';
import { CustomDashboard, DashboardComponent } from '../../types/dashboard';
import OpenAI from 'openai';

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: jest.fn().mockResolvedValue({
            response: { text: () => 'HR Database loaded.' }
          })
        }),
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              name: "Department Salary Overview",
              description: "Overview of salary distribution across departments",
              components: [
                {
                  type: "chart",
                  config: {
                    title: "Department Salary Distribution",
                    description: "Total salary by department",
                    chartType: "bar",
                    dataSource: {
                      type: "department",
                      metric: "salary",
                      calculation: "sum",
                      groupBy: "department"
                    },
                    visualization: {
                      showLegend: true,
                      showValues: true
                    }
                  }
                },
                {
                  type: "metric",
                  config: {
                    title: "Total Employees",
                    description: "Total number of employees",
                    dataSource: {
                      type: "metric",
                      metric: "count",
                    },
                    visualization: {
                      showValues: true
                    }
                  }
                }
              ]
            })
          }
        })
      };
    }
  }
}));

// Mock fetch for Claude API
global.fetch = jest.fn();

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                name: 'Test Dashboard',
                description: 'Test Description',
                components: [{
                  id: 'table-1',
                  type: 'table',
                  config: {
                    title: 'Employee Details',
                    description: 'List of employees',
                    dataSource: {
                      type: 'custom',
                      filters: []
                    },
                    visualization: {
                      showValues: true
                    }
                  },
                  layout: { x: 0, y: 0, w: 12, h: 4 }
                }]
              })
            }
          }]
        })
      }
    }
  }));
});

describe('AIService Dashboard Generation', () => {
  let aiService: AIService;
  const mockHRData: SalaryData = {
    employees: [
      {
        id: 1,
        name: 'John Doe',
        position: 'Manager',
        department: 'Leadership',
        division: 'Operations',
        salary: 100000,
        specialty: 'Management',
        termination_month: null
      },
      {
        id: 2,
        name: 'Jane Smith',
        position: 'Developer',
        department: 'Back Office',
        division: 'Technology',
        salary: 80000,
        specialty: 'Software',
        termination_month: null
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = getAIService('test-api-key', 'gemini');
    aiService.setHRData(mockHRData);
  });

  describe('generateDashboard', () => {
    it('should generate a dashboard with Gemini', async () => {
      const prompt = "Show me salary distribution by department";
      const dashboard = await aiService.generateDashboard(prompt);

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.name).toBe("Department Salary Overview");
      expect(dashboard.description).toBe("Overview of salary distribution across departments");
      expect(dashboard.components).toHaveLength(2);
      expect(dashboard.isAIGenerated).toBe(true);
      expect(dashboard.prompt).toBe(prompt);
    });

    it('should generate components with proper layout', async () => {
      const dashboard = await aiService.generateDashboard("Show department metrics");
      
      dashboard.components.forEach(component => {
        expect(component.layout).toBeDefined();
        expect(typeof component.layout.x).toBe('number');
        expect(typeof component.layout.y).toBe('number');
        expect(typeof component.layout.w).toBe('number');
        expect(typeof component.layout.h).toBe('number');
      });
    });

    it('should handle chart components correctly', async () => {
      const dashboard = await aiService.generateDashboard("Show salary charts");
      
      const chartComponent = dashboard.components.find(c => c.type === 'chart');
      expect(chartComponent).toBeDefined();
      expect(chartComponent?.config.chartType).toBeDefined();
      expect(chartComponent?.config.visualization.showLegend).toBe(true);
      expect(chartComponent?.config.visualization.colors).toBeDefined();
    });

    it('should handle metric components correctly', async () => {
      const dashboard = await aiService.generateDashboard("Show key metrics");
      
      const metricComponent = dashboard.components.find(c => c.type === 'metric');
      expect(metricComponent).toBeDefined();
      expect(metricComponent?.config.visualization.showValues).toBe(true);
      expect(metricComponent?.layout.w).toBe(3); // Quarter width for metrics
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      const mockError = new Error('API Error');
      jest.spyOn(aiService['geminiModel'], 'generateContent')
        .mockRejectedValueOnce(mockError);

      await expect(aiService.generateDashboard("Test prompt"))
        .rejects.toThrow('Failed to generate dashboard configuration');
    });
  });

  describe('Dashboard Generation with Claude', () => {
    let aiService: AIService;

    beforeEach(() => {
      jest.clearAllMocks();
      aiService = getAIService('test-api-key', 'claude');
      aiService.setHRData(mockHRData);

      // Mock successful Claude API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{
            text: JSON.stringify({
              name: "Department Salary Overview",
              description: "Overview of salary distribution across departments",
              components: [
                {
                  type: "chart",
                  config: {
                    title: "Department Salary Distribution",
                    description: "Total salary by department",
                    chartType: "bar",
                    dataSource: {
                      type: "department",
                      metric: "salary",
                      groupBy: "department"
                    },
                    visualization: {
                      showLegend: true,
                      showValues: true
                    }
                  }
                }
              ]
            })
          }]
        })
      });
    });

    it('should generate a dashboard with Claude', async () => {
      const dashboard = await aiService.generateDashboard("Show department overview");
      
      expect(dashboard).toBeDefined();
      expect(dashboard.components).toBeDefined();
      expect(dashboard.isAIGenerated).toBe(true);
    });

    it('should handle Claude API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(aiService.generateDashboard("Test prompt"))
        .rejects.toThrow('Failed to generate dashboard configuration');
    });
  });

  describe('Dashboard Generation with OpenAI', () => {
    let aiService: AIService;
    let openAICreateSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      aiService = getAIService('test-api-key', 'openai');
      aiService.setHRData(mockHRData);

      // Set up spy for OpenAI
      const openAIClient = (aiService as any).openaiClient;
      openAICreateSpy = jest.spyOn(openAIClient.chat.completions, 'create');
    });

    it('should generate a dashboard with OpenAI', async () => {
      const dashboard = await aiService.generateDashboard("Show department overview");
      
      expect(dashboard).toBeDefined();
      expect(dashboard.components).toBeDefined();
      expect(dashboard.isAIGenerated).toBe(true);
    });

    it('should handle OpenAI API errors', async () => {
      // Mock OpenAI API error
      jest.spyOn(aiService as any, 'callOpenAIAPI').mockRejectedValue(new Error('OpenAI API Error'));

      await expect(aiService.generateDashboard("Test prompt"))
        .rejects.toThrow('Failed to generate dashboard configuration');
    });

    it('should send all data to LLM when no department focus is specified', async () => {
      await aiService.generateDashboard('Show me the salary distribution');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify that the context includes all employees
      expect(contextSentToLLM).toContain('Total Employees: 2');
      expect(contextSentToLLM).toContain('Leadership');
      expect(contextSentToLLM).toContain('Back Office');
    });

    it('should send only BOD data to LLM when BOD department is focused', async () => {
      await aiService.generateDashboard('Show me the BOD salary distribution');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify that the context is filtered for BOD
      expect(contextSentToLLM).toContain('Department: Leadership');
      expect(contextSentToLLM).not.toContain('Back Office');
      expect(contextSentToLLM).toContain('Total Employees: 1'); // Only BOD employee
    });

    it('should send filtered data to LLM when using multiple filters', async () => {
      await aiService.generateDashboard('Show me BOD Directors in Operations division');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify that the context is filtered correctly
      expect(contextSentToLLM).toContain('Department: Leadership');
      expect(contextSentToLLM).toContain('Division: Operations');
      expect(contextSentToLLM).toContain('Position: Manager');
      expect(contextSentToLLM).toContain('Total Employees: 1'); // Only BOD Director
    });

    it('should send salary range filtered data to LLM', async () => {
      await aiService.generateDashboard('Show employees with salary between 90k and 110k');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify that the context includes only employees in the salary range
      expect(contextSentToLLM).toContain('John Doe');
      expect(contextSentToLLM).not.toContain('Jane Smith'); // Salary below range
    });

    it('should include correct metrics in filtered context', async () => {
      await aiService.generateDashboard('Show Leadership department dashboard');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify department metrics
      expect(contextSentToLLM).toMatch(/Leadership.*Total Salary: \$100,000/); // Sum of Leadership salaries
      expect(contextSentToLLM).toMatch(/Leadership.*Average: \$100,000/); // Average of Leadership salaries
      expect(contextSentToLLM).toMatch(/Leadership.*Employees: 1/); // Count of Leadership employees
    });

    it('should handle chat messages with filtered context', async () => {
      await aiService.chatWithAI('Tell me about the Leadership department');
      
      const contextSentToLLM = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Verify that chat context is filtered
      expect(contextSentToLLM).toContain('Department: Leadership');
      expect(contextSentToLLM).toContain('Total Employees: 1');
      expect(contextSentToLLM).not.toContain('Back Office');
    });

    it('should maintain consistent filtering across multiple requests', async () => {
      // First request with BOD filter
      await aiService.generateDashboard('Show Leadership dashboard');
      const firstContext = openAICreateSpy.mock.calls[0][0].messages[0].content;
      
      // Second request with same filter
      await aiService.generateDashboard('Update Leadership view');
      const secondContext = openAICreateSpy.mock.calls[1][0].messages[0].content;
      
      // Contexts should be consistent
      expect(firstContext).toEqual(secondContext);
    });
  });

  describe('Layout Optimization', () => {
    it('should position components correctly in grid', async () => {
      const dashboard = await aiService.generateDashboard("Show department analysis");
      
      // Check if components don't overlap
      const positions = new Set();
      dashboard.components.forEach(component => {
        const position = `${component.layout.x},${component.layout.y}`;
        expect(positions.has(position)).toBe(false);
        positions.add(position);
      });
    });

    it('should respect component type widths', async () => {
      const dashboard = await aiService.generateDashboard("Show complete analysis");
      
      dashboard.components.forEach(component => {
        switch (component.type) {
          case 'metric':
            expect(component.layout.w).toBe(3);
            break;
          case 'table':
            expect(component.layout.w).toBe(12);
            break;
          case 'chart':
            expect(component.layout.w).toBe(6);
            break;
        }
      });
    });
  });
}); 