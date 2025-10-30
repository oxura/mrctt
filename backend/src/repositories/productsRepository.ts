import { pool, PoolClientLike } from '../db/client';
import { AppError } from '../utils/appError';
import { Product } from '../types/models';

export interface CreateProductDto {
  name: string;
  description?: string | null;
  type: 'course' | 'service' | 'other';
  price?: number;
  status?: 'active' | 'archived';
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  type?: 'course' | 'service' | 'other';
  price?: number | null;
  status?: 'active' | 'archived';
}

export interface ProductsFilter {
  type?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface ProductsListResult {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class ProductsRepository {
  async create(tenantId: string, data: CreateProductDto, client?: PoolClientLike): Promise<Product> {
    const db = client || pool;
    const query = `
      INSERT INTO products (
        tenant_id, name, description, type, price, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      tenantId,
      data.name,
      data.description || null,
      data.type,
      data.price || null,
      data.status || 'active',
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  async findById(tenantId: string, productId: string, client?: PoolClientLike): Promise<Product> {
    const db = client || pool;
    const query = `
      SELECT *
      FROM products
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await db.query(query, [productId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    return result.rows[0];
  }

  async findAll(tenantId: string, filters: ProductsFilter, client?: PoolClientLike): Promise<ProductsListResult> {
    const db = client || pool;
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 1;

    if (filters.type) {
      paramCount++;
      conditions.push(`type = $${paramCount}`);
      values.push(filters.type);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    const sortBy = filters.sort_by || 'created_at';
    const allowedSortFields: Record<string, string> = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      name: 'name',
      price: 'price',
    };
    const finalSortBy = allowedSortFields[sortBy] ?? 'created_at';
    const finalSortDirection = filters.sort_direction === 'asc' ? 'ASC' : 'DESC';

    const page = filters.page || 1;
    const pageSize = filters.page_size || 25;
    const offset = (page - 1) * pageSize;

    const dataQuery = `
      SELECT *
      FROM products
      ${whereClause}
      ORDER BY ${finalSortBy} ${finalSortDirection}
      LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}
    `;

    values.push(pageSize, offset);

    const dataResult = await db.query(dataQuery, values);

    return {
      products: dataResult.rows,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };
  }

  async update(tenantId: string, productId: string, data: UpdateProductDto, client?: PoolClientLike): Promise<Product> {
    const db = client || pool;
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
    }

    if (data.type !== undefined) {
      paramCount++;
      fields.push(`type = $${paramCount}`);
      values.push(data.type);
    }

    if (data.price !== undefined) {
      paramCount++;
      fields.push(`price = $${paramCount}`);
      values.push(data.price);
    }

    if (data.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(tenantId, productId, client);
    }

    paramCount++;
    values.push(productId);
    paramCount++;
    values.push(tenantId);

    const query = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    return result.rows[0];
  }

  async updateStatus(tenantId: string, productId: string, status: 'active' | 'archived', client?: PoolClientLike): Promise<Product> {
    const db = client || pool;
    const query = `
      UPDATE products
      SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;

    const result = await db.query(query, [status, productId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    return result.rows[0];
  }

  async batchUpdateStatus(
    tenantId: string,
    productIds: string[],
    status: 'active' | 'archived',
    client?: PoolClientLike
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const productId of productIds) {
      try {
        await this.updateStatus(tenantId, productId, status, client);
        updated++;
      } catch (error) {
        failed++;
      }
    }

    return { updated, failed };
  }

  async delete(tenantId: string, productId: string, client?: PoolClientLike): Promise<void> {
    const db = client || pool;
    const query = `
      DELETE FROM products
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await db.query(query, [productId, tenantId]);

    if (result.rowCount === 0) {
      throw new AppError('Product not found', 404);
    }
  }
}

export default new ProductsRepository();
