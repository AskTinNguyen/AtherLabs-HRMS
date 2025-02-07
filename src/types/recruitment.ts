export interface Position {
    id: string;
    title: string;
    department: string;
    division: string;
    baseSalary: number;
    budgetImpact: number;
    yearlyBudgetImpact: number;
    expectedStartMonth: number; // 1-12 for Jan-Dec
    status: 'open' | 'in-progress' | 'filled';
    approvalStatus: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

export interface NewHire {
    id: string;
    candidateName: string;
    positionId: string;
    onboardingStatus: 'pending' | 'in-progress' | 'completed';
    startDate: Date;
    probationEndDate: Date;
    salary: number;
    department: string;
    division: string;
}

export interface OnboardingTask {
    id: string;
    newHireId: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate: Date;
    completedDate?: Date;
}

export interface PositionApproval {
    id: string;
    positionId: string;
    approverId: string;
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Types for API responses
export interface PositionResponse {
    position: Position;
    budgetAnalysis: {
        departmentImpact: number;
        yearlyImpact: number;
        availableBudget: number;
    };
}

export interface NewHireResponse {
    newHire: NewHire;
    position: Position;
    onboardingTasks: OnboardingTask[];
}

// Types for API requests
export interface CreatePositionRequest {
    title: string;
    department: string;
    division: string;
    baseSalary: number;
    expectedStartMonth: number; // 1-12 for Jan-Dec
}

export interface UpdatePositionStatusRequest {
    status: Position['status'];
    approvalStatus?: Position['approvalStatus'];
}

export interface CreateNewHireRequest {
    candidateName: string;
    positionId: string;
    startDate: Date;
    probationEndDate: Date;
    salary: number;
}

export interface UpdateNewHireRequest {
    onboardingStatus: NewHire['onboardingStatus'];
} 