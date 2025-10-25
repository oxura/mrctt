import { pool } from './client';
import '../config/env';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].now);

    console.log('\nChecking if roles table exists...');
    const checkRoles = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'roles'
      )`
    );

    if (checkRoles.rows[0].exists) {
      console.log('✅ Roles table exists');
      const rolesCount = await pool.query('SELECT COUNT(*) FROM roles');
      console.log(`   Found ${rolesCount.rows[0].count} roles`);
    } else {
      console.log('❌ Roles table does not exist. Run migrations first.');
    }

    console.log('\nChecking if permissions table exists...');
    const checkPermissions = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'permissions'
      )`
    );

    if (checkPermissions.rows[0].exists) {
      console.log('✅ Permissions table exists');
      const permissionsCount = await pool.query('SELECT COUNT(*) FROM permissions');
      console.log(`   Found ${permissionsCount.rows[0].count} permissions`);
    } else {
      console.log('❌ Permissions table does not exist. Run migrations first.');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
