import { Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import { PermissionRepository } from '../repositories/permissionRepository';
import { TeamInviteRepository } from '../repositories/teamInviteRepository';
import { TeamMemberRepository } from '../repositories/teamMemberRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { hashPassword } from '../utils/password';
import { emailService } from '../services/emailService';
import { env } from '../config/env';
import { withTransaction } from '../db/client';

const userRepo = new UserRepository();
const permissionRepo = new PermissionRepository();
const teamInviteRepo = new TeamInviteRepository();
const teamMemberRepo = new TeamMemberRepository();
const tenantRepo = new TenantRepository();

const sendInviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'manager'], {
    errorMap: () => ({ message: 'Role must be admin or manager' }),
  }),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'manager'], {
    errorMap: () => ({ message: 'Role must be admin or manager' }),
  }),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
});

export const listTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const users = await userRepo.listByTenant(req.tenantId);
  const teamMembers = await teamMemberRepo.listByTenant(req.tenantId);
  const pendingInvites = await teamInviteRepo.listByTenant(req.tenantId);

  const usersWithRoles = users.map((user) => {
    const { password_hash: passwordHash, ...userWithoutPassword } = user;
    void passwordHash;

    const teamMember = teamMembers.find((tm) => tm.user_id === user.id);

    return {
      ...userWithoutPassword,
      teamMemberStatus: teamMember?.status || 'active',
      invitedBy: teamMember?.invited_by || null,
      invitedAt: teamMember?.invited_at || null,
      joinedAt: teamMember?.joined_at || null,
    };
  });

  const invites = pendingInvites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: 'pending',
    invitedBy: invite.created_by,
    invitedAt: invite.created_at,
    expiresAt: invite.expires_at,
  }));

  res.status(200).json({
    status: 'success',
    data: {
      users: usersWithRoles,
      pendingInvites: invites,
    },
  });
});

export const sendTeamInvite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId || !req.user) {
    throw new AppError('Tenant or user not resolved', 400);
  }

  const parsed = sendInviteSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { email, role } = parsed.data;

  const existingUser = await userRepo.findByEmail(email, req.tenantId);

  if (existingUser) {
    throw new AppError('User with this email already exists in this tenant', 409);
  }

  const tenant = await tenantRepo.findById(req.tenantId);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await teamInviteRepo.create({
    tenant_id: req.tenantId,
    email,
    role,
    token,
    created_by: req.user.id,
    expires_at: expiresAt,
  });

  const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${token}`;
  const inviterName = req.user.first_name
    ? `${req.user.first_name}${req.user.last_name ? ' ' + req.user.last_name : ''}`
    : req.user.email;

  await emailService.sendTeamInviteEmail(email, inviteUrl, tenant.name, inviterName, role);

  res.status(201).json({
    status: 'success',
    message: 'Invitation sent successfully',
    data: {
      email,
      role,
      expiresAt,
    },
  });
});

export const verifyInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw new AppError('Token is required', 400);
  }

  const invite = await teamInviteRepo.findByToken(token);

  if (!invite) {
    throw new AppError('Invalid or expired invitation', 404);
  }

  if (invite.accepted_at) {
    throw new AppError('Invitation already accepted', 400);
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new AppError('Invitation has expired', 400);
  }

  const tenant = await tenantRepo.findById(invite.tenant_id);

  if (!tenant) {
    throw new AppError('Tenant not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      email: invite.email,
      role: invite.role,
      companyName: tenant.name,
    },
  });
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const parsed = acceptInviteSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { token, password, firstName, lastName } = parsed.data;

  const result = await withTransaction(async (client) => {
    const invite = await teamInviteRepo.findByToken(token, client);

    if (!invite) {
      throw new AppError('Invalid or expired invitation', 404);
    }

    if (invite.accepted_at) {
      throw new AppError('Invitation already accepted', 400);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    const existingUser = await userRepo.findByEmail(invite.email, invite.tenant_id, client);

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await userRepo.create(
      {
        tenant_id: invite.tenant_id,
        email: invite.email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: invite.role,
      },
      client
    );

    await teamMemberRepo.create(
      {
        tenant_id: invite.tenant_id,
        user_id: user.id,
        role: invite.role,
        status: 'active',
        invited_by: invite.created_by,
        invited_at: new Date(invite.created_at),
        joined_at: new Date(),
      },
      client
    );

    await teamInviteRepo.markAsAccepted(token, client);

    const tenant = await tenantRepo.findById(invite.tenant_id, client);

    const { password_hash: passwordHashColumn, ...userWithoutPassword } = user;
    void passwordHashColumn;

    return { user: userWithoutPassword, tenant };
  });

  res.status(201).json({
    status: 'success',
    message: 'Invitation accepted successfully. You can now log in.',
    data: result,
  });
});

export const updateTeamMemberRole = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId || !req.user) {
    throw new AppError('Tenant or user not resolved', 400);
  }

  const { userId } = req.params;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const parsed = updateRoleSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { role } = parsed.data;

  const targetUser = await userRepo.findById(userId);

  if (!targetUser || targetUser.tenant_id !== req.tenantId) {
    throw new AppError('User not found in this tenant', 404);
  }

  if (targetUser.role === 'owner') {
    throw new AppError('Cannot change the role of the owner', 403);
  }

  if (targetUser.id === req.user.id) {
    throw new AppError('Cannot change your own role', 403);
  }

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      role,
      userId,
    ]);

    await teamMemberRepo.updateRole(req.tenantId!, userId, role, client);
  });

  res.status(200).json({
    status: 'success',
    message: 'Role updated successfully',
  });
});

export const removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId || !req.user) {
    throw new AppError('Tenant or user not resolved', 400);
  }

  const { userId } = req.params;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const targetUser = await userRepo.findById(userId);

  if (!targetUser || targetUser.tenant_id !== req.tenantId) {
    throw new AppError('User not found in this tenant', 404);
  }

  if (targetUser.role === 'owner') {
    throw new AppError('Cannot remove the owner', 403);
  }

  if (targetUser.id === req.user.id) {
    throw new AppError('Cannot remove yourself', 403);
  }

  await withTransaction(async (client) => {
    await teamMemberRepo.delete(req.tenantId!, userId, client);

    await client.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
  });

  res.status(200).json({
    status: 'success',
    message: 'Team member removed successfully',
  });
});

export const cancelInvite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) {
    throw new AppError('Tenant not resolved', 400);
  }

  const { inviteId } = req.params;

  if (!inviteId) {
    throw new AppError('Invite ID is required', 400);
  }

  await teamInviteRepo.delete(inviteId);

  res.status(200).json({
    status: 'success',
    message: 'Invitation cancelled successfully',
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
