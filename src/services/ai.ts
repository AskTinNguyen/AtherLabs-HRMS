import { GoogleGenerativeAI } from '@google/generative-ai';
import { SalaryData, Employee } from '../types/salary';
import { 
  CustomDashboard, 
  DashboardComponent, 
  DashboardComponentConfig,
  DashboardFocus
} from '../types/dashboard';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { ModelProvider } from '../components/chat/types';

const GEMINI_MODEL = 'gemini-pro';
const OPENAI_MODEL = 'gpt-4-turbo-preview';

export class AIService {
  private geminiModel: any;
  private openaiClient: OpenAI | null = null;
  private hrData: SalaryData | null = null;
  private chat: any = null;
  private modelProvider: ModelProvider = 'gemini';

  constructor(apiKey: string, modelProvider: ModelProvider = 'gemini') {
    this.modelProvider = modelProvider;
    switch (modelProvider) {
      case 'gemini':
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        this.initChat();
        break;
      case 'openai':
        this.openaiClient = new OpenAI({ 
          apiKey,
          baseURL: 'https://api.openai.com/v1',
          dangerouslyAllowBrowser: true
        });
        break;
      case 'claude':
        throw new Error('Claude API is not supported in this version. Please use OpenAI or Gemini instead.');
    }
  }

  private initChat() {
    if (this.modelProvider === 'gemini' && this.geminiModel) {
      this.chat = this.geminiModel.startChat({
        history: [],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
    }
  }

  setHRData(data: SalaryData) {
    console.log('AIService receiving HR data:', {
      employeeCount: data?.employees?.length,
      sampleData: data?.employees?.[0],
      provider: this.modelProvider
    });
    this.hrData = data;
    // Reinitialize chat only for Gemini
    if (this.modelProvider === 'gemini') {
      this.initChat();
    }
  }

  private calculateDepartmentMetrics() {
    if (!this.hrData?.employees) return null;

    const employees = this.hrData.employees;
    
    // Calculate metrics for specific departments
    const getDepartmentMetrics = (deptName: string) => {
      const deptEmployees = employees.filter(e => 
        e.department.toLowerCase() === deptName.toLowerCase() ||
        e.specialty.toLowerCase() === deptName.toLowerCase()
      );
      const total = deptEmployees.reduce((sum, emp) => sum + emp.salary, 0);
      return {
        count: deptEmployees.length,
        total: total,
        average: deptEmployees.length > 0 ? total / deptEmployees.length : 0
      };
    };

    // Calculate metrics for each key department
    const bod = getDepartmentMetrics('BOD');
    const backOffice = getDepartmentMetrics('Back Office');
    const leadership = getDepartmentMetrics('Leadership');

    return {
      bod,
      backOffice,
      leadership,
      total: {
        count: employees.length,
        total: employees.reduce((sum, emp) => sum + emp.salary, 0)
      }
    };
  }

  private calculatePositionMetrics() {
    if (!this.hrData?.employees) return null;

    const employees = this.hrData.employees;
    const positions = Array.from(new Set(employees.map(e => e.position)));
    
    const positionDetails = positions.map(position => {
      const positionEmployees = employees.filter(e => e.position === position);
      const total = positionEmployees.reduce((sum, emp) => sum + emp.salary, 0);
      return {
        position,
        count: positionEmployees.length,
        total,
        average: total / positionEmployees.length,
        employees: positionEmployees.map(e => ({
          name: e.name,
          salary: e.salary,
          department: e.department
        }))
      };
    });

    return positionDetails;
  }

  private generateHRContext(data?: SalaryData): string {
    const hrData = data || this.hrData;
    if (!hrData) {
      console.warn('HR data is not accessible in AIService');
      return 'Note: HR database is not currently accessible.';
    }

    console.log('Generating HR context with data:', {
      employeeCount: hrData.employees.length,
      departments: Array.from(new Set(hrData.employees.map(e => e.department))),
    });

    const employees = hrData.employees;
    const departments = Array.from(new Set(employees.map(e => e.department)));
    const positions = Array.from(new Set(employees.map(e => e.position)));
    
    // Get department-specific metrics
    const metrics = this.calculateDepartmentMetrics();
    // Get position-specific metrics
    const positionMetrics = this.calculatePositionMetrics();
    
    return `
    CURRENT HR DATABASE STATISTICS:
    
    Dashboard Metrics (EXACT VALUES):
    - Total Monthly Salary: $${metrics?.total.total.toLocaleString()}
    - Total Employees: ${metrics?.total.count} employees

    Department Breakdown:
    1. BOD (Board of Directors):
       - Total Salary: $${metrics?.bod.total.toLocaleString()}
       - Employees: ${metrics?.bod.count}
       - Average: $${metrics?.bod.average.toLocaleString()}

    2. Back Office:
       - Total Salary: $${metrics?.backOffice.total.toLocaleString()}
       - Employees: ${metrics?.backOffice.count}
       - Average: $${metrics?.backOffice.average.toLocaleString()}

    3. Leadership:
       - Total Salary: $${metrics?.leadership.total.toLocaleString()}
       - Employees: ${metrics?.leadership.count}
       - Average: $${metrics?.leadership.average.toLocaleString()}

    Position-Specific Information:
    ${positionMetrics?.map(pos => 
      `${pos.position}:
       - Salary: $${pos.total.toLocaleString()}
       - Department: ${pos.employees[0].department}
       - Number of employees: ${pos.count}`
    ).join('\n    ')}

    Additional Department Statistics:
    ${departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptTotal = deptEmployees.reduce((sum, emp) => sum + emp.salary, 0);
      const deptAvg = deptTotal / deptEmployees.length;
      return `${dept}: ${deptEmployees.length} employees, total $${deptTotal.toLocaleString()}, avg $${deptAvg.toLocaleString()}`;
    }).join('\n    ')}

    Available Positions:
    ${positions.join(', ')}

    IMPORTANT: 
    - These numbers are current and exact
    - BOD total salary is $${metrics?.bod.total.toLocaleString()}
    - Back Office total salary is $${metrics?.backOffice.total.toLocaleString()}
    - Leadership total salary is $${metrics?.leadership.total.toLocaleString()}
    - Total monthly salary across all departments is $${metrics?.total.total.toLocaleString()}
    `;
  }

  private async chatWithGemini(message: string): Promise<string> {
    try {
      if (this.modelProvider !== 'gemini') {
        throw new Error('Gemini is not configured as the current provider');
      }

      if (!this.geminiModel) {
        throw new Error('Gemini model is not initialized');
      }

      if (!this.chat) {
        this.initChat();
      }

      if (!this.chat) {
        throw new Error('Failed to initialize Gemini chat');
      }

      const context = this.generateHRContext();
      console.log('Generated context length:', context.length);
      
      // First, send the context as a system message
      await this.chat.sendMessage(`You are an AI HR Assistant with the following current HR database information:

      ${context}

      IMPORTANT INSTRUCTIONS:
      1. ALWAYS use the EXACT numbers provided above
      2. Never say you don't have access to the data
      3. Format numbers with commas
      4. When asked about specific positions, use the position-specific information provided
      5. Be direct and precise in your answers
      6. Always include the employee count when discussing departments or positions

      Acknowledge these instructions with "HR Database loaded." and wait for the user query.`);

      // Now send the actual user message
      const result = await this.chat.sendMessage(message);
      const response = await result.response.text();
      return response;
    } catch (error) {
      console.error('Error in Gemini API call:', error);
      if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
      }
      throw new Error('An error occurred while communicating with Gemini AI');
    }
  }

  private async callOpenAIAPI(message: string): Promise<string> {
    try {
      if (!this.openaiClient) {
        throw new Error('OpenAI client is not initialized');
      }

      const context = this.generateHRContext();
      
      const response = await this.openaiClient.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI HR Assistant with the following current HR database information:
            ${context}
            
            IMPORTANT INSTRUCTIONS:
            1. ALWAYS use the EXACT numbers provided above
            2. Never say you don't have access to the data
            3. Format numbers with commas
            4. When asked about specific positions, use the position-specific information provided
            5. Be direct and precise in your answers
            6. Always include the employee count when discussing departments or positions`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI API');
      }

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in OpenAI API call:', error);
      if (error instanceof Error) {
        throw new Error(`OpenAI API Error: ${error.message}`);
      }
      throw new Error('An error occurred while communicating with OpenAI');
    }
  }

  async chatWithAI(message: string): Promise<string> {
    // If this is a dashboard generation request, use a different prompt
    const isDashboardRequest = message.toLowerCase().includes('dashboard') || 
                             message.toLowerCase().includes('show') || 
                             message.toLowerCase().includes('generate');
    
    if (isDashboardRequest) {
      const context = this.generateHRContext();
      const dashboardPrompt = this.generateDashboardPrompt(message, context);
      
      switch (this.modelProvider) {
        case 'gemini':
          if (!this.geminiModel) {
            throw new Error('Gemini model is not initialized');
          }
          const result = await this.geminiModel.generateContent(dashboardPrompt);
          return result.response.text();
          
        case 'openai':
          if (!this.openaiClient) {
            throw new Error('OpenAI client is not initialized');
          }
          const response = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
              {
                role: 'system',
                content: dashboardPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2048
          });
          return response.choices[0]?.message?.content || '';
          
        default:
          throw new Error('Invalid model provider');
      }
    }
    
    // For regular chat messages, use the existing implementation
    switch (this.modelProvider) {
      case 'gemini':
        return this.chatWithGemini(message);
      case 'openai':
        return this.callOpenAIAPI(message);
      case 'claude':
        throw new Error('Claude API is not supported in this version. Please use OpenAI or Gemini instead.');
      default:
        throw new Error('Invalid model provider');
    }
  }

  // Add this method to validate API keys
  async validateApiKey(): Promise<void> {
    try {
      switch (this.modelProvider) {
        case 'gemini':
          if (!this.geminiModel) {
            throw new Error('Gemini model is not initialized');
          }
          await this.geminiModel.generateContent('test');
          break;
        case 'openai':
          if (!this.openaiClient) {
            throw new Error('OpenAI client is not initialized');
          }
          await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
          });
          break;
        case 'claude':
          throw new Error('Claude API is not supported in this version. Please use OpenAI or Gemini instead.');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${this.modelProvider} API Error: ${error.message}`);
      }
      throw new Error(`An error occurred while validating the ${this.modelProvider} API key`);
    }
  }

  private generateDashboardPrompt(userPrompt: string, context: string): string {
    return `
    You are an AI HR Assistant tasked with generating a dashboard configuration.
    Here is the HR data you have access to:
    ${context}

    CREATE A DASHBOARD based on this request: "${userPrompt}"

    CRITICAL INSTRUCTIONS:
    1. You MUST respond with ONLY a valid JSON object
    2. Do NOT include any explanatory text before or after the JSON
    3. The JSON must follow this exact structure:
    {
      "name": "Dashboard title reflecting the focus",
      "description": "Clear description of what this dashboard shows",
      "components": [
        {
          "id": "unique-id",
          "type": "chart|table|metric",
          "config": {
            "title": "Component title",
            "description": "Component description",
            "chartType": "bar|pie|line",
            "dataSource": {
              "type": "department|position|role",
              "metric": "salary|employees|avgSalary",
              "calculation": "sum|average|count",
              "groupBy": "department|position|role",
              "filters": [
                {
                  "field": "salary",
                  "operator": "greaterThan|lessThan|equals",
                  "value": number
                }
              ]
            },
            "visualization": {
              "showLegend": true,
              "showValues": true,
              "colors": ["#4CAF50", "#2196F3"]
            }
          },
          "layout": {
            "x": 0,
            "y": 0,
            "w": 6,
            "h": 4
          }
        }
      ]
    }

    IMPORTANT:
    1. Each component must have all required fields
    2. Include appropriate filters based on the user's request
    3. Use exact numbers from the provided context
    4. Choose appropriate visualizations for the data
    5. DO NOT include any text outside the JSON structure
    6. The response must be valid JSON that can be parsed with JSON.parse()
    `;
  }

  private validateDashboardResponse(response: any): CustomDashboard {
    // Validate required fields
    if (!response.name || !response.description || !Array.isArray(response.components)) {
      throw new Error('Invalid dashboard format: missing required fields');
    }

    // Validate each component
    response.components.forEach((component: DashboardComponent, index: number) => {
      if (!component.id || !component.type || !component.config || !component.layout) {
        throw new Error(`Invalid component format at index ${index}`);
      }

      // Validate layout
      const { x, y, w, h } = component.layout;
      if (typeof x !== 'number' || typeof y !== 'number' || 
          typeof w !== 'number' || typeof h !== 'number') {
        throw new Error(`Invalid layout format at component ${index}`);
      }

      // Validate config
      const { title, dataSource } = component.config;
      if (!title || !dataSource || !dataSource.type) {
        throw new Error(`Invalid config format at component ${index}`);
      }
    });

    // Add required fields if missing
    return {
      ...response,
      id: response.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated: true
    };
  }

  async generateDashboard(prompt: string): Promise<CustomDashboard> {
    try {
      // Extract department focus from prompt
      const departmentMatch = prompt.match(/\b(Engineering|Art|Marketing|HR|Finance|Admin|BOD|Management)\b/i);
      const focusDepartment = departmentMatch ? departmentMatch[1] : undefined;
      
      // Pre-filter data if department is specified
      let filteredContext: SalaryData | undefined;
      let dashboardFocus: DashboardFocus | undefined;
      
      if (focusDepartment && this.hrData) {
        const filteredEmployees = this.hrData.employees.filter(emp => 
          emp.department.toLowerCase() === focusDepartment.toLowerCase()
        );
        
        // Create a filtered context with only relevant data
        filteredContext = {
          employees: filteredEmployees,
          metadata: {
            total_employees: filteredEmployees.length,
            divisions: Array.from(new Set(filteredEmployees.map(emp => emp.division))),
            last_updated: this.hrData.metadata?.last_updated || new Date().toISOString()
          }
        };
        
        // Set dashboard focus
        dashboardFocus = {
          department: focusDepartment
        };
      }
      
      // Generate context using filtered data if available
      const context = this.generateHRContext(filteredContext);
      const dashboardPrompt = this.generateDashboardPrompt(prompt, context);
      
      // Get AI response
      let aiResponse;
      switch (this.modelProvider) {
        case 'gemini':
          if (!this.geminiModel) {
            throw new Error('Gemini model is not initialized');
          }
          const result = await this.geminiModel.generateContent(dashboardPrompt);
          aiResponse = result.response.text();
          break;
          
        case 'openai':
          if (!this.openaiClient) {
            throw new Error('OpenAI client is not initialized');
          }
          const response = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
              {
                role: 'system',
                content: dashboardPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2048
          });
          aiResponse = response.choices[0]?.message?.content || '';
          break;
          
        default:
          throw new Error('Invalid model provider');
      }
      
      // Clean up the response
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      
      // Parse and validate the dashboard
      let aiDashboard;
      try {
        aiDashboard = JSON.parse(cleanedResponse);
      } catch (initialParseError) {
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiDashboard = JSON.parse(jsonMatch[0]);
        } else {
          throw initialParseError;
        }
      }

      // Validate and enhance the dashboard
      const validatedDashboard = this.validateDashboardResponse(aiDashboard);
      const enhancedComponents = this.enhanceComponents(validatedDashboard.components);
      const optimizedComponents = this.optimizeLayout(enhancedComponents);
      
      // Create the final dashboard
      return {
        ...validatedDashboard,
        id: uuidv4(),
        name: dashboardFocus ? `${dashboardFocus.department} Department Dashboard` : validatedDashboard.name || "Department Comparison Dashboard",
        description: dashboardFocus ? `Analysis of ${dashboardFocus.department} department metrics` : validatedDashboard.description || "Comparison of salary metrics between departments",
        components: optimizedComponents,
        focus: dashboardFocus,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIGenerated: true,
        prompt
      };
    } catch (error) {
      console.error('Error generating dashboard:', error);
      throw new Error('Failed to generate dashboard configuration');
    }
  }

  private enhanceComponents(components: DashboardComponent[]): DashboardComponent[] {
    return components.map(component => {
      // Add default values and validate component configuration
      const enhancedConfig: DashboardComponentConfig = {
        ...component.config,
        visualization: {
          showLegend: true,
          showValues: true,
          ...component.config.visualization,
          colors: component.config.visualization.colors || this.getDefaultColors(),
        }
      };

      // Validate and enhance data source configuration
      if (component.type === 'chart') {
        this.validateChartConfig(enhancedConfig);
      }

      return {
        ...component,
        id: uuidv4(),
        config: enhancedConfig
      };
    });
  }

  private optimizeLayout(components: DashboardComponent[]): DashboardComponent[] {
    const GRID_COLUMNS = 12;
    const DEFAULT_COMPONENT_HEIGHT = 4;
    
    let currentY = 0;
    
    return components.map((component, index) => {
      // Determine component width based on type and position
      let width = 6; // Default to half-width
      if (component.type === 'metric') {
        width = 3; // Metrics are quarter-width
      } else if (component.type === 'table') {
        width = 12; // Tables are full-width
      }

      // Calculate position
      const x = index % 2 === 0 ? 0 : 6;
      if (index % 2 === 0 && index > 0) {
        currentY += DEFAULT_COMPONENT_HEIGHT;
      }

      return {
        ...component,
        layout: {
          x,
          y: currentY,
          w: width,
          h: DEFAULT_COMPONENT_HEIGHT
        }
      };
    });
  }

  private validateChartConfig(config: DashboardComponentConfig): void {
    // Validate chart type matches data structure
    if (config.chartType === 'pie' && !config.dataSource.groupBy) {
      config.chartType = 'bar'; // Default to bar if no grouping for pie
    }

    // Ensure appropriate data source type
    if (!config.dataSource.type) {
      config.dataSource.type = 'metric';
    }

    // Add default calculations if needed
    if (!config.dataSource.calculation && config.dataSource.type === 'metric') {
      config.dataSource.calculation = 'sum';
    }
  }

  private getDefaultColors(): string[] {
    return [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FFC107', // Amber
      '#E91E63', // Pink
      '#9C27B0', // Purple
      '#FF5722'  // Deep Orange
    ];
  }
}

// Singleton instance for the AI service
let aiService: AIService | null = null;

export const getAIService = (apiKey: string, modelProvider: ModelProvider = 'gemini'): AIService => {
  if (!aiService || apiKey) {
    aiService = new AIService(apiKey, modelProvider);
  }
  return aiService;
};

export const saveSalaryToFiles = async (employees: Employee[]): Promise<void> => {
  try {
    // Save to salary.json
    const jsonData = {
      employees,
      metadata: {
        total_employees: employees.length,
        divisions: Array.from(new Set(employees.map(emp => emp.division))).sort(),
        last_updated: new Date().toISOString()
      }
    };
    
    const response = await fetch('/api/save-salary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to save salary data: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error('Failed to save salary data: Operation was not successful');
    }
    
  } catch (error) {
    console.error('Error saving salary data to files:', error);
    throw error;
  }
}; 