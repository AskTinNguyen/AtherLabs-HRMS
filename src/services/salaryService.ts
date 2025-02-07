import { Employee } from '../types/salary';

const STORAGE_KEY = 'salary_data';

export const saveSalaryData = async (employees: Employee[]): Promise<void> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ employees }));
  } catch (error) {
    console.error('Error saving salary data:', error);
    throw new Error('Failed to save salary data');
  }
};

export const loadSalaryData = async (): Promise<{ employees: Employee[] }> => {
  try {
    // Clear localStorage to ensure we don't use cached data
    localStorage.removeItem(STORAGE_KEY);

    // Read the current salary.json file
    const response = await fetch('/api/current-data');
    if (!response.ok) {
      throw new Error('Failed to fetch data from server');
    }
    const data = await response.json();
    
    // Save to localStorage for future use
    await saveSalaryData(data.employees);
    
    return data;
  } catch (error) {
    console.error('Error loading salary data:', error);
    throw new Error('Failed to load salary data');
  }
}; 