import { Employee } from './salary';

export interface DashboardFilter {
  field: keyof Employee;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
}

export interface DashboardComponentLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardComponentConfig {
  title: string;
  description?: string;
  chartType?: 'bar' | 'pie' | 'line' | 'scatter';
  dataSource: {
    type: 'metric' | 'department' | 'position' | 'division' | 'custom';
    metric?: string;
    calculation?: string;
    filters?: DashboardFilter[];
    groupBy?: string;
    sortBy?: string;
  };
  visualization: {
    colors?: string[];
    labels?: string[];
    showLegend?: boolean;
    showValues?: boolean;
  };
}

export interface DashboardComponent {
  id: string;
  type: 'chart' | 'metric' | 'table';
  config: DashboardComponentConfig;
  layout: DashboardComponentLayout;
}

export interface DashboardFocus {
  department?: string;
  subDepartment?: string;
  specialty?: string;
  position?: string;
  division?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  components: DashboardComponent[];
  createdAt: Date;
  updatedAt: Date;
  isAIGenerated: boolean;
  prompt?: string;
  focus?: DashboardFocus;
}

// Helper type for dashboard metrics
export interface DashboardMetric {
  name: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  previousValue?: number;
}

// Type for dashboard data source configuration
export interface DashboardDataSource {
  type: 'realtime' | 'cached' | 'historical';
  refreshInterval?: number;
  cacheExpiry?: number;
}

// Type for dashboard permissions
export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
}

// Type for dashboard sharing settings
export interface DashboardSharing {
  isPublic: boolean;
  sharedWith?: string[];
  expiresAt?: Date;
}

// Extended dashboard interface with additional features
export interface EnhancedDashboard extends CustomDashboard {
  permissions: DashboardPermissions;
  sharing?: DashboardSharing;
  dataSource: DashboardDataSource;
  tags?: string[];
  version: number;
  lastModifiedBy?: string;
} 