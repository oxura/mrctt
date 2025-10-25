import { pool, PoolClientLike } from '../db/client';
import { Tenant } from '../types/models';

export class TenantRepository {
  async create(
    data: {
      name: string;
      slug: string;
      country?: string | null;
      city?: string | null;
      industry?: string | null;
      settings?: Record<string, unknown>;
    },
    client: PoolClientLike = pool
  ): Promise<Tenant> {
    const result = await client.query(
      `INSERT INTO tenants (name, slug, country, city, industry, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.country || null,
        data.city || null,
        data.industry || null,
        data.settings || {},
      ]
    );

    return result.rows[0] as Tenant;
  }

  async findById(tenantId: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    const rows = result.rows as Tenant[];
    return rows[0] || null;
  }

  async findBySlug(slug: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE lower(slug) = lower($1)', [slug]);
    const rows = result.rows as Tenant[];
    return rows[0] || null;
  }

  async listAll(client: PoolClientLike = pool): Promise<Tenant[]> {
    const result = await client.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows as Tenant[];
  }
}
