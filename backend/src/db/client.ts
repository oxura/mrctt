import { Pool, PoolClient as PgPoolClient } from 'pg';
import { env } from '../config/env';
import logger from '../utils/logger';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl:
    env.DATABASE_URL.includes('neon.tech') || env.DATABASE_URL.includes('amazonaws.com')
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

export const withTransaction = async <T>(
  callback: (client: PoolClientLike) => Promise<T>,
  tenantId?: string
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (tenantId) {
      await client.query('SET LOCAL app.tenant_id = $1', [tenantId]);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const acquireTenantClient = async (
  tenantId: string
): Promise<{ client: PgPoolClient; release: () => void }> => {
  const client = await pool.connect();
  await client.query('SET LOCAL app.tenant_id = $1', [tenantId]);
  const release = () => {
    client.release();
  };
  return { client, release };
};

export const setTenantContext = async (
  client: PoolClientLike | PgPoolClient,
  tenantId: string
): Promise<void> => {
  await client.query('SET LOCAL app.tenant_id = $1', [tenantId]);
};

export interface PoolClientLike {
  query<T = any>(text: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
}
