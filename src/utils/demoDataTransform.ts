import { Employee } from '../types/salary';

const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
  'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

// Generate consistent fake name based on employee ID
export const getFakeName = (id: number): string => {
  const firstNameIndex = id % firstNames.length;
  const lastNameIndex = Math.floor(id / firstNames.length) % lastNames.length;
  return `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`;
};

// Generate consistent fake salary based on employee ID and original salary range
export const getFakeSalary = (id: number, originalSalary: number): number => {
  const base = 50000 + (id * 1731) % 100000; // Use prime number for better distribution
  const variation = originalSalary * 0.1; // Maintain similar salary ranges
  return Math.round(base + (variation * Math.sin(id))); // Add some controlled randomness
};

// Transform employee data for demo mode
export const transformEmployeeData = (employee: Employee): Employee => {
  return {
    ...employee,
    name: getFakeName(employee.id),
    salary: getFakeSalary(employee.id, employee.salary),
  };
};

// Transform array of employees
export const transformEmployeesData = (employees: Employee[]): Employee[] => {
  return employees.map(transformEmployeeData);
}; 