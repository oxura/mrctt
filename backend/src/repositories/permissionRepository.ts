import { pool, PoolClientLike } from '../db/client';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  scope: string | null;
  description: string | null;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export class PermissionRepository {
  async getRoleByName(name: string, client: PoolClientLike = pool): Promise<Role | null> {
    const result = await client.query<Role>(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  async getPermissionsByRole(roleName: string, client: PoolClientLike = pool): Promise<Permission[]> {
    const result = await client.query<Permission>(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN roles r ON r.id = rp.role_id
       WHERE r.name = $1`,
      [roleName]
    );
    return result.rows;
  }

  async getPermissionsByUserId(userId: string, client: PoolClientLike = pool): Promise<Permission[]> {
    const result = await client.query<Permission>(
      `SELECT DISTINCT p.* FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN roles r ON r.id = rp.role_id
       JOIN users u ON u.role = r.name
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows;
  }

  async hasPermission(
    userId: string,
    permissionName: string,
    client: PoolClientLike = pool
  ): Promise<boolean> {
    const result = await client.query<{ has_permission: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         JOIN users u ON u.role = r.name
         WHERE u.id = $1 AND p.name = $2
       ) as has_permission`,
      [userId, permissionName]
    );
    return result.rows[0]?.has_permission || false;
  }

  async hasAnyPermission(
    userId: string,
    permissionNames: string[],
    client: PoolClientLike = pool
  ): Promise<boolean> {
    if (permissionNames.length === 0) return false;

    const result = await client.query<{ has_permission: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         JOIN users u ON u.role = r.name
         WHERE u.id = $1 AND p.name = ANY($2)
       ) as has_permission`,
      [userId, permissionNames]
    );
    return result.rows[0]?.has_permission || false;
  }

  async getAllRoles(client: PoolClientLike = pool): Promise<Role[]> {
    const result = await client.query<Role>(
      'SELECT * FROM roles ORDER BY name'
    );
    return result.rows;
  }

  async getAllPermissions(client: PoolClientLike = pool): Promise<Permission[]> {
    const result = await client.query<Permission>(
      'SELECT * FROM permissions ORDER BY resource, action'
    );
    return result.rows;
  }
}
