import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Task } from './useTasks';

export interface TaskFilters {
  assignedTo?: string;
  status?: 'all' | 'completed' | 'pending' | 'overdue';
  dateFrom?: string;
  dateTo?: string;
  leadId?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  lead_id?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  priority?: 'low' | 'medium' | 'high';
  is_completed?: boolean;
}

export const useAllTasks = (filters?: TaskFilters) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.leadId) params.append('leadId', filters.leadId);

      const response = await api.get(`/api/v1/tasks?${params.toString()}`);
      setTasks(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchCalendarTasks = async (dateFrom: string, dateTo: string): Promise<Task[]> => {
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      const response = await api.get(`/api/v1/tasks/calendar?${params.toString()}`);
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to fetch calendar tasks');
    }
  };

  const fetchOverdueTasks = async (userId?: string): Promise<Task[]> => {
    try {
      const params = userId ? new URLSearchParams({ userId }) : '';
      const response = await api.get(`/api/v1/tasks/overdue${params ? '?' + params : ''}`);
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to fetch overdue tasks');
    }
  };

  const createTask = async (data: CreateTaskDto): Promise<Task> => {
    try {
      const response = await api.post('/api/v1/tasks', data);
      await fetchTasks();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTask = async (taskId: string, data: UpdateTaskDto): Promise<Task> => {
    try {
      const response = await api.patch(`/api/v1/tasks/${taskId}`, data);
      await fetchTasks();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/tasks/${taskId}`);
      await fetchTasks();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const toggleTaskComplete = async (taskId: string, isCompleted: boolean): Promise<Task> => {
    return updateTask(taskId, { is_completed: isCompleted });
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    fetchCalendarTasks,
    fetchOverdueTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
  };
};
