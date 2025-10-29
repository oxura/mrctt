import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface Task {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_name?: string | null;
  created_name?: string | null;
  lead_first_name?: string | null;
  lead_last_name?: string | null;
}

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  priority?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  priority?: string;
  is_completed?: boolean;
}

export const useTasks = (leadId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/leads/${leadId}/tasks`);
      setTasks(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: CreateTaskDto): Promise<Task> => {
    try {
      const response = await api.post(`/api/v1/leads/${leadId}/tasks`, data);
      await fetchTasks();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTask = async (taskId: string, data: UpdateTaskDto): Promise<Task> => {
    try {
      const response = await api.patch(`/api/v1/leads/${leadId}/tasks/${taskId}`, data);
      await fetchTasks();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/leads/${leadId}/tasks/${taskId}`);
      await fetchTasks();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};
