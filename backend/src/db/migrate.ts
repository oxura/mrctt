import { promises as fs } from 'fs';
import path from 'path';
import { pool } from './client';
import logger from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

interface Migration {
  id: number;
  name: string;
  applied_at: Date;
}

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query(
    'SELECT name FROM migrations ORDER BY id ASC'
  );
  const rows = result.rows as Migration[];
  return rows.map((row) => row.name);
}

async function applyMigration(filename: string) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = await fs.readFile(filePath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    await client.query('COMMIT');
    logger.info(`✅ Applied migration: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`❌ Failed to apply migration: ${filename}`, error);
    throw error;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    await ensureMigrationsTable();

    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const appliedMigrations = await getAppliedMigrations();

    const pendingMigrations = migrationFiles.filter(
      (f) => !appliedMigrations.includes(f)
    );

    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }

    logger.info('✅ All migrations completed successfully');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}

async function rollbackMigration(filename: string) {
  const downFilePath = path.join(MIGRATIONS_DIR, filename.replace('.sql', '.down.sql'));
  
  try {
    const sql = await fs.readFile(downFilePath, 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('DELETE FROM migrations WHERE name = $1', [filename]);
      await client.query('COMMIT');
      logger.info(`✅ Rolled back migration: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ Failed to rollback migration: ${filename}`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logger.warn(`⚠️  No rollback script found for ${filename}`);
    } else {
      throw error;
    }
  }
}

export async function rollbackToVersion(targetVersion: string) {
  try {
    logger.info(`Rolling back to version: ${targetVersion}`);
    await ensureMigrationsTable();

    const appliedMigrations = await getAppliedMigrations();
    const targetIndex = appliedMigrations.indexOf(targetVersion);

    if (targetIndex === -1) {
      logger.warn(`Target version ${targetVersion} not found in applied migrations`);
      return;
    }

    const migrationsToRollback = appliedMigrations.slice(targetIndex + 1).reverse();

    if (migrationsToRollback.length === 0) {
      logger.info('✅ No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${migrationsToRollback.length} migration(s)`);

    for (const migration of migrationsToRollback) {
      await rollbackMigration(migration);
    }

    logger.info('✅ Rollback completed successfully');
  } catch (error) {
    logger.error('Rollback error:', error);
    throw error;
  }
}

if (process.argv[1]?.includes('migrate')) {
  const command = process.argv[2];
  const targetVersion = process.argv[3];

  if (command === 'down' && targetVersion) {
    rollbackToVersion(targetVersion)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}
