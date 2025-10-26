import { useState, useEffect } from 'react';
import api from '../utils/api';

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

interface LeadsChartDataPoint {
  date: string;
  count: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  actor_name: string;
  created_at: string;
  lead_id: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  lead_id: string | null;
  lead_name: string | null;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/v1/dashboard/stats');
        setStats(response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

export const useLeadsChart = (days: number = 30) => {
  const [chartData, setChartData] = useState<LeadsChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/dashboard/leads-chart?days=${days}`);
        setChartData(response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [days]);

  return { chartData, loading, error };
};

export const useActivityFeed = (limit: number = 10) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/v1/dashboard/activity?limit=${limit}`);
        setActivities(response.data.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch activity feed');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  return { activities, loading, error };
};

export const useMyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/dashboard/tasks');
      setTasks(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    try {
      await api.patch(`/api/v1/dashboard/tasks/${taskId}`, { isCompleted });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, is_completed: isCompleted } : task
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  return { tasks, loading, error, updateTaskCompletion, refetch: fetchTasks };
};
