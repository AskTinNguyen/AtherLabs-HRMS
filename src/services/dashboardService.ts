import { v4 as uuidv4 } from 'uuid';
import { 
  CustomDashboard, 
  EnhancedDashboard, 
  DashboardPermissions 
} from '../types/dashboard';

// Storage Strategy Interface
interface DashboardStorage {
  save(dashboard: CustomDashboard): Promise<void>;
  getAll(): Promise<CustomDashboard[]>;
  getById(id: string): Promise<CustomDashboard | null>;
  update(dashboard: CustomDashboard): Promise<void>;
  delete(id: string): Promise<void>;
}

// Local Storage Implementation
class LocalDashboardStorage implements DashboardStorage {
  private readonly STORAGE_KEY = 'custom_dashboards';
  private dashboards: Map<string, CustomDashboard>;

  constructor() {
    this.dashboards = new Map();
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const dashboards = JSON.parse(stored) as CustomDashboard[];
        dashboards.forEach(dashboard => {
          // Convert string dates back to Date objects
          dashboard.createdAt = new Date(dashboard.createdAt);
          dashboard.updatedAt = new Date(dashboard.updatedAt);
          this.dashboards.set(dashboard.id, dashboard);
        });
      }
    } catch (error) {
      console.error('Error loading dashboards from localStorage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const dashboardArray = Array.from(this.dashboards.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dashboardArray));
    } catch (error) {
      console.error('Error saving dashboards to localStorage:', error);
      throw new Error('Failed to save dashboards to local storage');
    }
  }

  async save(dashboard: CustomDashboard): Promise<void> {
    this.dashboards.set(dashboard.id, dashboard);
    await this.saveToStorage();
  }

  async getAll(): Promise<CustomDashboard[]> {
    return Array.from(this.dashboards.values());
  }

  async getById(id: string): Promise<CustomDashboard | null> {
    return this.dashboards.get(id) || null;
  }

  async update(dashboard: CustomDashboard): Promise<void> {
    if (!this.dashboards.has(dashboard.id)) {
      throw new Error('Dashboard not found');
    }
    dashboard.updatedAt = new Date();
    this.dashboards.set(dashboard.id, dashboard);
    await this.saveToStorage();
  }

  async delete(id: string): Promise<void> {
    this.dashboards.delete(id);
    await this.saveToStorage();
  }
}

// Server Storage Implementation (can be added later if needed)
class ServerDashboardStorage implements DashboardStorage {
  // ... server implementation
  async save(dashboard: CustomDashboard): Promise<void> {
    // Implementation for server storage
  }

  async getAll(): Promise<CustomDashboard[]> {
    // Implementation for server storage
    return [];
  }

  async getById(id: string): Promise<CustomDashboard | null> {
    // Implementation for server storage
    return null;
  }

  async update(dashboard: CustomDashboard): Promise<void> {
    // Implementation for server storage
  }

  async delete(id: string): Promise<void> {
    // Implementation for server storage
  }
}

export class DashboardService {
  private storage: DashboardStorage;

  constructor(useLocalStorage: boolean = true) {
    this.storage = useLocalStorage ? new LocalDashboardStorage() : new ServerDashboardStorage();
  }

  async createDashboard(
    name: string,
    description: string,
    isAIGenerated: boolean = false,
    prompt?: string
  ): Promise<CustomDashboard> {
    const dashboard: CustomDashboard = {
      id: uuidv4(),
      name,
      description,
      components: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isAIGenerated,
      prompt
    };

    await this.storage.save(dashboard);
    return dashboard;
  }

  async listDashboards(): Promise<CustomDashboard[]> {
    return this.storage.getAll();
  }

  async getDashboard(id: string): Promise<CustomDashboard | null> {
    return this.storage.getById(id);
  }

  async updateDashboard(dashboard: CustomDashboard): Promise<void> {
    await this.storage.update(dashboard);
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.storage.delete(id);
  }

  async duplicateDashboard(id: string): Promise<CustomDashboard> {
    const original = await this.getDashboard(id);
    if (!original) {
      throw new Error('Dashboard not found');
    }

    const duplicate: CustomDashboard = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.save(duplicate);
    return duplicate;
  }

  // Helper method to convert to enhanced dashboard
  async getEnhancedDashboard(id: string): Promise<EnhancedDashboard | null> {
    const dashboard = await this.getDashboard(id);
    if (!dashboard) return null;

    const permissions: DashboardPermissions = {
      canView: true,
      canEdit: true,
      canShare: true,
      canDelete: true
    };

    return {
      ...dashboard,
      permissions,
      dataSource: {
        type: 'realtime',
        refreshInterval: 300000 // 5 minutes
      },
      version: 1,
      lastModifiedBy: 'current_user' // Replace with actual user management
    };
  }
}

// Create a singleton instance
let dashboardService: DashboardService | null = null;

export const getDashboardService = (): DashboardService => {
  if (!dashboardService) {
    dashboardService = new DashboardService();
  }
  return dashboardService;
}; 