import tasksRepository, {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
} from '../repositories/tasksRepository';
import leadsRepository from '../repositories/leadsRepository';
import { pool } from '../db/client';

export class TasksService {
  async createTask(
    tenantId: string,
    leadId: string,
    userId: string,
    data: CreateTaskDto
  ): Promise<Task> {
    if (leadId) {
      await leadsRepository.findById(tenantId, leadId);
    }
    
    const taskData = { ...data, lead_id: leadId };
    const task = await tasksRepository.create(tenantId, taskData, userId);
    
    if (leadId) {
      await this.logTaskActivity(tenantId, leadId, userId, data.title);
    }
    
    return task;
  }

  async createStandaloneTask(
    tenantId: string,
    userId: string,
    data: CreateTaskDto
  ): Promise<Task> {
    if (data.lead_id) {
      await leadsRepository.findById(tenantId, data.lead_id);
    }
    
    const task = await tasksRepository.createStandalone(tenantId, data, userId);
    
    if (data.lead_id) {
      await this.logTaskActivity(tenantId, data.lead_id, userId, data.title);
    }
    
    return task;
  }

  async getTasksByLeadId(tenantId: string, leadId: string): Promise<Task[]> {
    await leadsRepository.findById(tenantId, leadId);
    return tasksRepository.findByLeadId(tenantId, leadId);
  }

  async getAllTasks(
    tenantId: string,
    filters?: {
      assignedTo?: string;
      status?: 'all' | 'completed' | 'pending' | 'overdue';
      dateFrom?: Date | string;
      dateTo?: Date | string;
      leadId?: string;
    }
  ): Promise<Task[]> {
    return tasksRepository.findAll(tenantId, filters);
  }

  async getTasksByDateRange(
    tenantId: string,
    dateFrom: Date | string,
    dateTo: Date | string
  ): Promise<Task[]> {
    return tasksRepository.findByDateRange(tenantId, dateFrom, dateTo);
  }

  async getOverdueTasks(tenantId: string, userId?: string): Promise<Task[]> {
    return tasksRepository.findOverdue(tenantId, userId);
  }

  async updateTask(
    tenantId: string,
    taskId: string,
    data: UpdateTaskDto
  ): Promise<Task> {
    return tasksRepository.update(tenantId, taskId, data);
  }

  async deleteTask(tenantId: string, taskId: string): Promise<void> {
    await tasksRepository.delete(tenantId, taskId);
  }

  private async logTaskActivity(
    tenantId: string,
    leadId: string,
    userId: string,
    taskTitle: string
  ): Promise<void> {
    const query = `
      INSERT INTO lead_activities (tenant_id, lead_id, user_id, activity_type, description)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [
      tenantId,
      leadId,
      userId,
      'task_created',
      `Создана задача: ${taskTitle}`,
    ]);
  }
}

export default new TasksService();
