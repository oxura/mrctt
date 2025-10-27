import commentsRepository, {
  Comment,
  CreateCommentDto,
} from '../repositories/commentsRepository';
import leadsRepository from '../repositories/leadsRepository';
import { pool } from '../db/client';

export class CommentsService {
  async createComment(
    tenantId: string,
    leadId: string,
    userId: string,
    data: CreateCommentDto
  ): Promise<Comment> {
    await leadsRepository.findById(tenantId, leadId);
    
    const comment = await commentsRepository.create(tenantId, leadId, userId, data);
    
    await this.logCommentActivity(tenantId, leadId, userId);
    
    return comment;
  }

  async getCommentsByLeadId(tenantId: string, leadId: string): Promise<Comment[]> {
    await leadsRepository.findById(tenantId, leadId);
    return commentsRepository.findByLeadId(tenantId, leadId);
  }

  private async logCommentActivity(
    tenantId: string,
    leadId: string,
    userId: string
  ): Promise<void> {
    const query = `
      INSERT INTO lead_activities (tenant_id, lead_id, user_id, activity_type, description)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [
      tenantId,
      leadId,
      userId,
      'comment_added',
      'Добавлен комментарий',
    ]);
  }
}

export default new CommentsService();
