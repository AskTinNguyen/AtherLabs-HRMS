import { v4 as uuidv4 } from 'uuid';
import {
  Position,
  NewHire,
  OnboardingTask,
  PositionApproval,
  CreatePositionRequest,
  CreateNewHireRequest,
} from '../types/recruitment';

// Load data from localStorage or return defaults
const loadRecruitmentData = () => {
  try {
    const positionsData = localStorage.getItem('positions');
    const newHiresData = localStorage.getItem('newHires');
    const tasksData = localStorage.getItem('onboardingTasks');
    const approvalsData = localStorage.getItem('positionApprovals');

    return {
      positions: positionsData ? JSON.parse(positionsData) : [],
      newHires: newHiresData ? JSON.parse(newHiresData) : [],
      tasks: tasksData ? JSON.parse(tasksData) : [],
      approvals: approvalsData ? JSON.parse(approvalsData) : [],
    };
  } catch (error) {
    console.error('Error loading recruitment data:', error);
    return {
      positions: [],
      newHires: [],
      tasks: [],
      approvals: [],
    };
  }
};

// Save data to localStorage
const saveRecruitmentData = (
  positions: Position[],
  newHires: NewHire[],
  tasks: OnboardingTask[],
  approvals: PositionApproval[],
) => {
  try {
    localStorage.setItem('positions', JSON.stringify(positions));
    localStorage.setItem('newHires', JSON.stringify(newHires));
    localStorage.setItem('onboardingTasks', JSON.stringify(tasks));
    localStorage.setItem('positionApprovals', JSON.stringify(approvals));
  } catch (error) {
    console.error('Error saving recruitment data:', error);
    throw new Error('Failed to save recruitment data');
  }
};

// Department-specific overhead multipliers
const DEPARTMENT_OVERHEAD_RATES: Record<string, number> = {
  'Engineering': 1.3, // 30% overhead for equipment, licenses, etc.
  'Design': 1.25, // 25% overhead for creative software, equipment
  'Marketing': 1.2, // 20% overhead
  'Business Intelligence': 1.2, // 20% overhead
  'Human Resources': 1.15, // 15% overhead
  'Production': 1.25, // 25% overhead for project management tools
  'QA': 1.2, // 20% overhead for testing equipment
  'Audio': 1.25, // 25% overhead for audio equipment
  'Executive': 1.35, // 35% overhead
  'Publishing': 1.2, // 20% overhead
  'R&D': 1.3, // 30% overhead for research equipment
  'Product Management': 1.2, // 20% overhead
  'UI/UX': 1.25, // 25% overhead for design tools
};

// Calculate budget impact based on salary and department rules
const calculateBudgetImpact = (baseSalary: number, department: string): number => {
  const overheadMultiplier = DEPARTMENT_OVERHEAD_RATES[department] || 1.2; // Default to 20% if department not found
  return Math.round(baseSalary * overheadMultiplier); // Round to nearest whole number
};

// Calculate yearly budget impact based on monthly impact and start month
const calculateYearlyBudgetImpact = (monthlyBudgetImpact: number, startMonth: number): number => {
  // Ensure startMonth is between 1 and 12
  const validStartMonth = Math.max(1, Math.min(12, startMonth));
  const remainingMonths = 13 - validStartMonth; // 13 because if starting in January (1), we want 12 months
  return Math.round(monthlyBudgetImpact * remainingMonths);
};

// Position operations
export const createPosition = async (request: CreatePositionRequest): Promise<Position> => {
  const data = loadRecruitmentData();
  
  const monthlyBudgetImpact = calculateBudgetImpact(request.baseSalary, request.department);
  const yearlyBudgetImpact = calculateYearlyBudgetImpact(monthlyBudgetImpact, request.expectedStartMonth);

  const newPosition: Position = {
    id: uuidv4(),
    ...request,
    budgetImpact: monthlyBudgetImpact,
    yearlyBudgetImpact,
    status: 'open',
    approvalStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  data.positions.push(newPosition);
  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return newPosition;
};

export const updatePosition = async (position: Position): Promise<Position> => {
  const data = loadRecruitmentData();
  
  const index = data.positions.findIndex((p: Position) => p.id === position.id);
  if (index === -1) throw new Error('Position not found');

  // Recalculate budget impacts if salary or department changed
  const monthlyBudgetImpact = calculateBudgetImpact(position.baseSalary, position.department);
  const yearlyBudgetImpact = calculateYearlyBudgetImpact(monthlyBudgetImpact, position.expectedStartMonth);

  const updatedPosition = {
    ...position,
    budgetImpact: monthlyBudgetImpact,
    yearlyBudgetImpact,
    updatedAt: new Date(),
  };

  data.positions[index] = updatedPosition;
  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return updatedPosition;
};

// New hire operations
export const createNewHire = async (request: CreateNewHireRequest): Promise<NewHire> => {
  const data = loadRecruitmentData();
  
  const position = data.positions.find((p: Position) => p.id === request.positionId);
  if (!position) throw new Error('Position not found');

  const newHire: NewHire = {
    id: uuidv4(),
    ...request,
    onboardingStatus: 'pending',
    department: position.department,
    division: position.division,
  };

  data.newHires.push(newHire);
  
  // Update position status
  position.status = 'in-progress';
  const positionIndex = data.positions.findIndex((p: Position) => p.id === position.id);
  data.positions[positionIndex] = position;

  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return newHire;
};

export const updateNewHire = async (newHire: NewHire): Promise<NewHire> => {
  const data = loadRecruitmentData();
  
  const index = data.newHires.findIndex((nh: NewHire) => nh.id === newHire.id);
  if (index === -1) throw new Error('New hire not found');

  data.newHires[index] = newHire;

  // If onboarding is completed, update position status
  if (newHire.onboardingStatus === 'completed') {
    const position = data.positions.find((p: Position) => p.id === newHire.positionId);
    if (position) {
      position.status = 'filled';
      const positionIndex = data.positions.findIndex((p: Position) => p.id === position.id);
      data.positions[positionIndex] = position;
    }
  }

  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return newHire;
};

// Task operations
export const createTask = async (
  title: string,
  description: string,
  newHireId: string,
  dueDate: Date,
): Promise<OnboardingTask> => {
  const data = loadRecruitmentData();
  
  const newHire = data.newHires.find((nh: NewHire) => nh.id === newHireId);
  if (!newHire) throw new Error('New hire not found');

  const task: OnboardingTask = {
    id: uuidv4(),
    newHireId,
    title,
    description,
    status: 'pending',
    dueDate,
  };

  data.tasks.push(task);
  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return task;
};

export const updateTask = async (task: OnboardingTask): Promise<OnboardingTask> => {
  const data = loadRecruitmentData();
  
  const index = data.tasks.findIndex((t: OnboardingTask) => t.id === task.id);
  if (index === -1) throw new Error('Task not found');

  // If task is being completed, set completedDate
  if (task.status === 'completed' && !task.completedDate) {
    task.completedDate = new Date();
  }

  data.tasks[index] = task;
  await saveRecruitmentData(data.positions, data.newHires, data.tasks, data.approvals);
  
  return task;
};

// Load all recruitment data
export const loadAllRecruitmentData = () => {
  return loadRecruitmentData();
}; 