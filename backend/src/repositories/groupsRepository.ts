import { pool } from '../db/client';
import { AppError } from '../utils/appError';
import { Group, GroupStatus } from '../types/models';

export interface CreateGroupDto {
  product_id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  max_capacity?: number | null;
}

export interface UpdateGroupDto {
  product_id?: string;
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
  max_capacity?: number | null;
  status?: GroupStatus;
}

export interface GroupsFilter {
  product_id?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface GroupsListResult {
  groups: Group[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class GroupsRepository {
  async create(tenantId: string, data: CreateGroupDto): Promise<Group> {
    const query = `
      INSERT INTO groups (
        tenant_id, product_id, name, start_date, end_date, max_capacity, current_capacity, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 'open')
      RETURNING *
    `;

    const values = [
      tenantId,
      data.product_id,
      data.name,
      data.start_date || null,
      data.end_date || null,
      data.max_capacity || null,
    ];

    const result = await pool.query(query, values);
    return this.findById(tenantId, result.rows[0].id);
  }

  async findById(tenantId: string, groupId: string): Promise<Group> {
    const query = `
      SELECT
        g.*,
        p.name AS product_name
      FROM groups g
      LEFT JOIN products p ON g.product_id = p.id
      WHERE g.id = $1 AND g.tenant_id = $2
    `;

    const result = await pool.query(query, [groupId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Group not found', 404);
    }

    return result.rows[0];
  }

  async findAll(tenantId: string, filters: GroupsFilter): Promise<GroupsListResult> {
    const conditions: string[] = ['g.tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 1;

    if (filters.product_id) {
      paramCount++;
      conditions.push(`g.product_id = $${paramCount}`);
      values.push(filters.product_id);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`g.status = $${paramCount}`);
      values.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      conditions.push(`(g.name ILIKE $${paramCount} OR p.name ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM groups g
      LEFT JOIN products p ON g.product_id = p.id
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0].total;

    const sortBy = filters.sort_by || 'created_at';
    const sortDirection = filters.sort_direction || 'desc';
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'start_date', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? `g.${sortBy}` : 'g.created_at';

    const page = filters.page || 1;
    const pageSize = filters.page_size || 25;
    const offset = (page - 1) * pageSize;

    const dataQuery = `
      SELECT
        g.*,
        p.name AS product_name
      FROM groups g
      LEFT JOIN products p ON g.product_id = p.id
      WHERE ${whereClause}
      ORDER BY ${finalSortBy} ${sortDirection.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(pageSize, offset);

    const dataResult = await pool.query(dataQuery, values);

    return {
      groups: dataResult.rows,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };
  }

  async update(tenantId: string, groupId: string, data: UpdateGroupDto): Promise<Group> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.product_id !== undefined) {
      paramCount++;
      fields.push(`product_id = $${paramCount}`);
      values.push(data.product_id);
    }

    if (data.name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
    }

    if (data.start_date !== undefined) {
      paramCount++;
      fields.push(`start_date = $${paramCount}`);
      values.push(data.start_date);
    }

    if (data.end_date !== undefined) {
      paramCount++;
      fields.push(`end_date = $${paramCount}`);
      values.push(data.end_date);
    }

    if (data.max_capacity !== undefined) {
      paramCount++;
      fields.push(`max_capacity = $${paramCount}`);
      values.push(data.max_capacity);
    }

    if (data.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(tenantId, groupId);
    }

    paramCount++;
    values.push(groupId);
    paramCount++;
    values.push(tenantId);

    const query = `
      UPDATE groups
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError('Group not found', 404);
    }

    return this.findById(tenantId, groupId);
  }

  async updateCurrentCapacity(tenantId: string, groupId: string): Promise<Group> {
    const countQuery = `
      SELECT COUNT(*)::int as lead_count
      FROM leads
      WHERE group_id = $1 AND tenant_id = $2
    `;

    const countResult = await pool.query(countQuery, [groupId, tenantId]);
    const currentCapacity = countResult.rows[0].lead_count;

    const group = await this.findById(tenantId, groupId);

    let newStatus = group.status;

    if (group.max_capacity) {
      if (currentCapacity >= group.max_capacity && group.status !== 'cancelled') {
        newStatus = 'closed';
      } else if (
        group.status === 'closed' &&
        currentCapacity < group.max_capacity
      ) {
        newStatus = 'open';
      }
    }

    const updateQuery = `
      UPDATE groups
      SET current_capacity = $1, status = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `;

    await pool.query(updateQuery, [currentCapacity, newStatus, groupId, tenantId]);

    return this.findById(tenantId, groupId);
  }

  async delete(tenantId: string, groupId: string): Promise<void> {
    const query = `
      DELETE FROM groups
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [groupId, tenantId]);

    if (result.rowCount === 0) {
      throw new AppError('Group not found', 404);
    }
  }
}

export default new GroupsRepository();
