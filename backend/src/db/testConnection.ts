import { pool } from './client';
import '../config/env';
import logger from '../utils/logger';

async function testConnection() {
  try {
    logger.info('Testing database connection');
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', { currentTime: result.rows[0].now });

    logger.info('Checking if roles table exists');
    const checkRoles = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'roles'
      )`
    );

    if (checkRoles.rows[0].exists) {
      const rolesCount = await pool.query('SELECT COUNT(*) FROM roles');
      logger.info('Roles table found', { count: rolesCount.rows[0].count });
    } else {
      logger.warn('Roles table does not exist. Run migrations first.');
    }

    logger.info('Checking if permissions table exists');
    const checkPermissions = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'permissions'
      )`
    );

    if (checkPermissions.rows[0].exists) {
      const permissionsCount = await pool.query('SELECT COUNT(*) FROM permissions');
      logger.info('Permissions table found', { count: permissionsCount.rows[0].count });
    } else {
      logger.warn('Permissions table does not exist. Run migrations first.');
    }

    await pool.end();
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
}

testConnection();
