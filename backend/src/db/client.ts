import { Pool } from 'pg';
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

export const withTransaction = async <T>(callback: (client: PoolClientLike) => Promise<T>) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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

export interface PoolClientLike {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number }>;
}
