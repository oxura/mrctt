import dashboardRepository from '../repositories/dashboardRepository';

interface DashboardStats {
  newLeads: {
    today: number;
    yesterday: number;
    percentChange: number;
  };
  activeDeals: {
    count: number;
  };
  sales: {
    totalAmount: number;
    currency: string;
  };
  overdueTasks: {
    count: number;
  };
}

export class DashboardService {
  async getStats(tenantId: string): Promise<DashboardStats> {
    const [newLeads, activeDeals, sales, overdueTasks] = await Promise.all([
      dashboardRepository.getNewLeadsStats(tenantId),
      dashboardRepository.getActiveDealsCount(tenantId),
      dashboardRepository.getSalesStats(tenantId),
      dashboardRepository.getOverdueTasksCount(tenantId),
    ]);

    return {
      newLeads,
      activeDeals,
      sales,
      overdueTasks,
    };
  }

  async getLeadsChart(tenantId: string, days: number = 30) {
    return dashboardRepository.getLeadsChartData(tenantId, days);
  }

  async getActivityFeed(tenantId: string, limit: number = 10) {
    return dashboardRepository.getActivityFeed(tenantId, limit);
  }

  async getMyTasks(tenantId: string, userId: string) {
    return dashboardRepository.getMyTasksToday(tenantId, userId);
  }

  async updateTaskCompletion(tenantId: string, taskId: string, isCompleted: boolean) {
    await dashboardRepository.updateTaskCompletion(taskId, tenantId, isCompleted);
  }
}

export default new DashboardService();
