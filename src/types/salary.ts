export interface Employee {
  id: number;
  name: string;
  position: string;
  specialty: string;
  department: string;
  division: string;
  salary: number;
  termination_month: number | null;
  isLeadership: boolean;
}

export interface SalaryData {
  employees: Employee[];
  metadata?: {
    total_employees: number;
    divisions: string[];
    last_updated: string;
  };
} 