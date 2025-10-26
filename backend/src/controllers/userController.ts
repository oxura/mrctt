import { Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import { PermissionRepository } from '../repositories/permissionRepository';
import { hashPassword } from '../utils/password';

const userRepo = new UserRepository();
const permissionRepo = new PermissionRepository();

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'manager'], {
    errorMap: () => ({ message: 'Role must be admin or manager' }),
  }),
});

export const listTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const users = await userRepo.listByTenant(req.tenantId);

  const usersWithoutPasswords = users.map((user) => {
    const { password_hash: passwordHash, ...userWithoutPassword } = user;
    void passwordHash;
    return userWithoutPassword;
  });

  res.status(200).json({
    status: 'success',
    data: { users: usersWithoutPasswords },
  });
});

export const inviteTeamMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const parsed = inviteUserSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { email, firstName, lastName, role } = parsed.data;

  const existingUser = await userRepo.findByEmail(email, req.tenantId);

  if (existingUser) {
    throw new AppError('User with this email already exists in this tenant', 409);
  }

  const temporaryPassword = randomBytes(12).toString('hex').slice(0, 16);
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await userRepo.create({
    tenant_id: req.tenantId,
    email,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName,
    role,
  });

  const { password_hash: passwordHash2, ...userWithoutPassword } = user;
  void passwordHash2;

  res.status(201).json({
    status: 'success',
    data: {
      user: userWithoutPassword,
      temporaryPassword,
    },
    message: 'User invited successfully. Send them the temporary password.',
  });
});

export const getCurrentUserPermissions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const permissions = await permissionRepo.getPermissionsByUserId(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      role: req.user.role,
      permissions: permissions.map((p) => p.name),
    },
  });
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const roles = await permissionRepo.getAllRoles();

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissions = await permissionRepo.getPermissionsByRole(role.name);
      return {
        ...role,
        permissions: permissions.map((p) => p.name),
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: { roles: rolesWithPermissions },
  });
});
