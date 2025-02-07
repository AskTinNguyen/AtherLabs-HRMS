import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIDashboard from '../AIDashboard';
import { CustomDashboard } from '../../../types/dashboard';
import { Employee } from '../../../types/salary';

// Mock ResizeObserver
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock data
const mockEmployees: Employee[] = [
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
    name: 'Bob Johnson',
    position: 'Director',
    department: 'BOD',
    division: 'Executive',
    salary: 180000,
    specialty: 'Finance',
    termination_month: null
  }
];

const mockDashboard: CustomDashboard = {
  id: 'test-dashboard',
  name: 'Test Dashboard',
  description: 'Test Description',
  components: [
    {
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
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
  isAIGenerated: true
};

describe('AIDashboard Filtering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const findEmployeeInTable = (name: string) => {
    // Get the table element first
    const table = screen.getByRole('table');
    // Look for the name within the table
    return within(table).queryByText(name);
  };

  const verifyEmployeeInTable = (employee: Employee) => {
    const employeeElement = findEmployeeInTable(employee.name);
    expect(employeeElement).toBeInTheDocument();
    
    // Get the row containing the employee name
    const row = employeeElement?.closest('tr');
    expect(row).toBeInTheDocument();
    
    if (row) {
      expect(within(row).getByText(employee.department)).toBeInTheDocument();
      expect(within(row).getByText(employee.position)).toBeInTheDocument();
      expect(within(row).getByText(new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(employee.salary))).toBeInTheDocument();
    }
  };

  const verifyEmployeeNotInTable = (name: string) => {
    const employeeElement = findEmployeeInTable(name);
    expect(employeeElement).not.toBeInTheDocument();
  };

  it('should show all data when no filters are applied', () => {
    const dashboardWithoutFocus = { ...mockDashboard, focus: undefined };
    render(<AIDashboard dashboard={dashboardWithoutFocus} data={mockEmployees} />);
    
    // Check if all employees are shown in the table
    mockEmployees.forEach(emp => {
      verifyEmployeeInTable(emp);
    });
  });

  it('should filter data by department (BOD)', () => {
    const dashboardWithFocus = {
      ...mockDashboard,
      focus: {
        department: 'BOD'
      }
    };
    
    render(<AIDashboard dashboard={dashboardWithFocus} data={mockEmployees} />);
    
    // Should show BOD employees
    verifyEmployeeInTable(mockEmployees[0]); // John Doe
    verifyEmployeeInTable(mockEmployees[2]); // Bob Johnson
    
    // Should not show Back Office employee
    verifyEmployeeNotInTable('Jane Smith');
  });

  it('should filter data by multiple criteria', () => {
    const dashboardWithMultipleFilters = {
      ...mockDashboard,
      focus: {
        department: 'BOD',
        division: 'Executive',
        position: 'Director'
      }
    };
    
    render(<AIDashboard dashboard={dashboardWithMultipleFilters} data={mockEmployees} />);
    
    // Should show only BOD Directors in Executive division
    verifyEmployeeInTable(mockEmployees[0]); // John Doe
    verifyEmployeeInTable(mockEmployees[2]); // Bob Johnson
    verifyEmployeeNotInTable('Jane Smith');
  });

  it('should filter data by salary range', () => {
    const dashboardWithSalaryFilter = {
      ...mockDashboard,
      focus: {
        salaryRange: {
          min: 190000,
          max: 210000
        }
      }
    };
    
    render(<AIDashboard dashboard={dashboardWithSalaryFilter} data={mockEmployees} />);
    
    // Should show only employees with salary between 190k and 210k
    verifyEmployeeInTable(mockEmployees[0]); // John Doe
    verifyEmployeeNotInTable('Bob Johnson');
    verifyEmployeeNotInTable('Jane Smith');
  });

  it('should update filtered data when dashboard focus changes', () => {
    const { rerender } = render(<AIDashboard dashboard={mockDashboard} data={mockEmployees} />);
    
    // Initially should show all employees
    mockEmployees.forEach(emp => {
      verifyEmployeeInTable(emp);
    });
    
    // Update dashboard with BOD filter
    const updatedDashboard = {
      ...mockDashboard,
      focus: {
        department: 'BOD'
      }
    };
    
    rerender(<AIDashboard dashboard={updatedDashboard} data={mockEmployees} />);
    
    // Should now only show BOD employees
    verifyEmployeeInTable(mockEmployees[0]); // John Doe
    verifyEmployeeInTable(mockEmployees[2]); // Bob Johnson
    verifyEmployeeNotInTable('Jane Smith');
  });
}); 