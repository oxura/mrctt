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

  async getTasksByLeadId(tenantId: string, leadId: string): Promise<Task[]> {
    await leadsRepository.findById(tenantId, leadId);
    return tasksRepository.findByLeadId(tenantId, leadId);
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
