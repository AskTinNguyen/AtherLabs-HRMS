import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIService, getAIService } from '../../ai';
import SalaryDashboard from '../../../components/salary/SalaryDashboard';
import SalaryChart from '../../../components/salary/SalaryChart';
import SalaryTable from '../../../components/salary/SalaryTable';
import { CustomDashboard } from '../../../types/dashboard';
import { SalaryData, Employee } from '../../../types/salary';

// Mock data update handler
const mockDataUpdate = jest.fn();

// Create a DashboardRenderer component for testing
const DashboardRenderer: React.FC<{
  dashboard: CustomDashboard;
  data: Employee[];
}> = ({ dashboard, data }) => {
  // Render components based on dashboard configuration
  return (
    <div data-testid="dashboard-container">
      {dashboard.components.map(component => {
        switch (component.type) {
          case 'chart':
            return (
              <div key={component.id} style={{ gridColumn: `span ${component.layout.w}` }}>
                <SalaryChart
                  data={data}
                  sidebarExpanded={false}
                />
              </div>
            );
          case 'table':
            return (
              <div key={component.id} style={{ gridColumn: `span ${component.layout.w}` }}>
                <SalaryTable
                  data={data}
                  onDataUpdate={mockDataUpdate}
                  sidebarExpanded={false}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

// Update mock implementations
jest.mock('../../../components/SalaryChart', () => ({
  __esModule: true,
  default: jest.fn(({ data }: { data: Employee[] }) => (
    <div data-testid="salary-chart">Chart Component</div>
  ))
}));

jest.mock('../../../components/SalaryTable', () => ({
  __esModule: true,
  default: jest.fn(({ data, onDataUpdate }: { data: Employee[], onDataUpdate: (data: Employee[]) => void }) => (
    <div data-testid="salary-table">Table Component</div>
  ))
}));

// Mock the AI service
jest.mock('../../ai', () => {
  const originalModule = jest.requireActual('../../ai');
  return {
    ...originalModule,
    getAIService: jest.fn(() => ({
      setHRData: jest.fn(),
      generateDashboard: jest.fn().mockResolvedValue({
        id: 'test-dashboard',
        name: 'Test Dashboard',
        description: 'Integration Test Dashboard',
        components: [
          {
            id: 'chart-1',
            type: 'chart',
            config: {
              title: 'Salary Distribution',
              description: 'Department salary distribution',
              chartType: 'bar',
              dataSource: {
                type: 'department',
                metric: 'salary',
                groupBy: 'department'
              },
              visualization: {
                showLegend: true,
                showValues: true,
                colors: ['#4CAF50', '#2196F3']
              }
            },
            layout: { x: 0, y: 0, w: 6, h: 4 }
          },
          {
            id: 'table-1',
            type: 'table',
            config: {
              title: 'Employee Details',
              description: 'Detailed employee information',
              dataSource: {
                type: 'department',
                filters: []
              },
              visualization: {
                showValues: true
              }
            },
            layout: { x: 0, y: 4, w: 12, h: 4 }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIGenerated: true,
        prompt: 'Show department analysis'
      })
    }))
  };
});

describe('Dashboard Generation Integration', () => {
  const mockEmployees: Employee[] = [
    {
      id: 1,
      name: 'John Doe',
      position: 'Director',
      department: 'BOD',
      division: 'Executive',
      salary: 200000,
      specialty: 'Management',
      termination_month: null,
      isLeadership: true
    },
    {
      id: 2,
      name: 'Jane Smith',
      position: 'Manager',
      department: 'Back Office',
      division: 'Operations',
      salary: 150000,
      specialty: 'Operations',
      termination_month: null,
      isLeadership: true
    },
    {
      id: 3,
      name: 'Bob Johnson',
      position: 'Director',
      department: 'BOD',
      division: 'Executive',
      salary: 180000,
      specialty: 'Finance',
      termination_month: null,
      isLeadership: true
    }
  ];

  const mockHRData: SalaryData = { employees: mockEmployees };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('End-to-End Dashboard Generation Flow', () => {
    it('should generate and render a complete dashboard', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      render(<DashboardRenderer dashboard={dashboard} data={mockEmployees} />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
        expect(screen.getByTestId('salary-chart')).toBeInTheDocument();
        expect(screen.getByTestId('salary-table')).toBeInTheDocument();
      });

      expect(SalaryChart).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockEmployees,
          sidebarExpanded: false
        }),
        expect.any(Object)
      );

      expect(SalaryTable).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockEmployees,
          onDataUpdate: expect.any(Function),
          sidebarExpanded: false
        }),
        expect.any(Object)
      );
    });

    it('should handle data updates correctly', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      const { rerender } = render(
        <DashboardRenderer dashboard={dashboard} data={mockEmployees} />
      );

      const updatedEmployees = [
        ...mockEmployees,
        {
          id: 4,
          name: 'New Employee',
          position: 'Analyst',
          department: 'Finance',
          division: 'Operations',
          salary: 75000,
          specialty: 'Financial Analysis',
          termination_month: null,
          isLeadership: false
        }
      ];

      rerender(<DashboardRenderer dashboard={dashboard} data={updatedEmployees} />);

      await waitFor(() => {
        expect(SalaryChart).toHaveBeenLastCalledWith(
          expect.objectContaining({
            data: updatedEmployees,
            sidebarExpanded: false
          }),
          expect.any(Object)
        );

        expect(SalaryTable).toHaveBeenLastCalledWith(
          expect.objectContaining({
            data: updatedEmployees,
            onDataUpdate: expect.any(Function),
            sidebarExpanded: false
          }),
          expect.any(Object)
        );
      });
    });

    it('should handle layout changes correctly', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      const modifiedDashboard: CustomDashboard = {
        ...dashboard,
        components: dashboard.components.map(component => ({
          ...component,
          layout: { ...component.layout, w: component.layout.w + 2 }
        }))
      };

      render(<DashboardRenderer dashboard={modifiedDashboard} data={mockEmployees} />);

      await waitFor(() => {
        const chart = screen.getByTestId('salary-chart');
        expect(chart.parentElement).toHaveStyle({
          gridColumn: expect.stringContaining('span')
        });
      });
    });

    it('should handle component filtering and updates', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      const filteredDashboard: CustomDashboard = {
        ...dashboard,
        components: dashboard.components.map(component => ({
          ...component,
          config: {
            ...component.config,
            dataSource: {
              ...component.config.dataSource,
              filters: [
                {
                  field: 'department',
                  operator: 'equals',
                  value: 'Back Office'
                }
              ]
            }
          }
        }))
      };

      render(<DashboardRenderer dashboard={filteredDashboard} data={mockEmployees} />);

      await waitFor(() => {
        expect(SalaryChart).toHaveBeenLastCalledWith(
          expect.objectContaining({
            data: mockEmployees,
            sidebarExpanded: false
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      render(<DashboardRenderer dashboard={dashboard} data={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
        expect(SalaryChart).toHaveBeenCalledWith(
          expect.objectContaining({
            data: [],
            sidebarExpanded: false
          }),
          expect.any(Object)
        );
      });
    });

    it('should handle invalid component configurations', async () => {
      const aiService = getAIService('test-api-key');
      aiService.setHRData(mockHRData);
      const dashboard = await aiService.generateDashboard('Show department analysis');
      
      const invalidDashboard: CustomDashboard = {
        ...dashboard,
        components: [
          {
            ...dashboard.components[0],
            config: {
              ...dashboard.components[0].config,
              chartType: 'invalid-type' as any
            }
          }
        ]
      };

      render(<DashboardRenderer dashboard={invalidDashboard} data={mockEmployees} />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
        expect(SalaryChart).toHaveBeenCalledWith(
          expect.objectContaining({
            data: mockEmployees,
            sidebarExpanded: false
          }),
          expect.any(Object)
        );
      });
    });
  });

  it('should generate a dashboard with Gemini', async () => {
    const aiService = getAIService('test-api-key', 'gemini');
    aiService.setHRData(mockHRData);

    const dashboard = await aiService.generateDashboard('Show salary distribution');
    expect(dashboard).toBeDefined();
    expect(dashboard.components.length).toBeGreaterThan(0);
  });

  it('should generate a dashboard with Claude', async () => {
    const aiService = getAIService('test-api-key', 'claude');
    aiService.setHRData(mockHRData);

    const dashboard = await aiService.generateDashboard('Show salary distribution');
    expect(dashboard).toBeDefined();
    expect(dashboard.components.length).toBeGreaterThan(0);
  });

  it('should generate a dashboard with OpenAI', async () => {
    const aiService = getAIService('test-api-key', 'openai');
    aiService.setHRData(mockHRData);

    const dashboard = await aiService.generateDashboard('Show salary distribution');
    expect(dashboard).toBeDefined();
    expect(dashboard.components.length).toBeGreaterThan(0);
  });
}); 