import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { hashPassword } from '../../lib/password.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { updateUserTags } from '../cometchat/cometchat-sync.service.js';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  isActive: true,
  lastLoginAt: true,
  lastFailedLoginAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

export async function listUsers(filters: {
  page: number;
  limit: number;
  role?: Prisma.EnumUserRoleFilter['equals'];
  department?: Prisma.EnumDepartmentFilter['equals'];
  isActive?: boolean;
}) {
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.department ? { department: filters.department } : {}),
    ...(typeof filters.isActive === 'boolean' ? { isActive: filters.isActive } : {})
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    }),
    prisma.user.count({ where })
  ]);

  return {
    items,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit))
    }
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Prisma.UserCreateInput['role'];
  department: Prisma.UserCreateInput['department'];
  isActive?: boolean;
  actorId: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      department: input.department,
      isActive: input.isActive ?? true
    },
    select: safeUserSelect
  });

  await recordActivityLog({
    userId: input.actorId,
    action: 'user_created',
    entityType: 'user',
    entityId: user.id,
    metadata: {
      role: user.role,
      department: user.department,
      isActive: user.isActive
    }
  });

  return user;
}

export async function updateUser(
  userId: string,
  input: {
    name?: string;
    email?: string;
    password?: string;
    role?: Prisma.UserUpdateInput['role'];
    department?: Prisma.UserUpdateInput['department'];
    isActive?: boolean;
    actorId: string;
  }
) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (input.email && input.email !== existingUser.email) {
    const emailInUse = await prisma.user.findUnique({ where: { email: input.email } });

    if (emailInUse) {
      throw new AppError('Email already registered', 409);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.department ? { department: input.department } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {})
    },
    select: safeUserSelect
  });

  // Sync CometChat tags when role or department changes (non-blocking).
  // Only trigger if the user has a cometchat_uid and something actually changed.
  const roleChanged = input.role && input.role !== existingUser.role;
  const departmentChanged = input.department && input.department !== existingUser.department;

  if (roleChanged || departmentChanged) {
    updateUserTags(userId, updatedUser.role, updatedUser.department).catch((error) => {
      console.error(`[CometChat] Failed to update tags for user ${userId}:`, error);
    });
  }

  await recordActivityLog({
    userId: input.actorId,
    action: 'user_updated',
    entityType: 'user',
    entityId: userId,
    metadata: {
      role: updatedUser.role,
      department: updatedUser.department,
      isActive: updatedUser.isActive
    }
  });

  return updatedUser;
}

export async function deactivateUser(userId: string, actorId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: safeUserSelect
  });

  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  await recordActivityLog({
    userId: actorId,
    action: 'user_deactivated',
    entityType: 'user',
    entityId: userId,
    metadata: { email: updatedUser.email }
  });

  return updatedUser;
}

export async function updateFcmToken(userId: string, fcmToken: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
    select: safeUserSelect
  });

  await recordActivityLog({
    userId,
    action: 'user_updated',
    entityType: 'user',
    entityId: userId,
    metadata: { field: 'fcmToken' }
  });

  return user;
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
}

export async function updateProfile(userId: string, input: { name?: string; email?: string }) {
  const user = await prisma.user.update({ where: { id: userId }, data: input, select: safeUserSelect });

  await recordActivityLog({
    userId,
    action: 'user_updated',
    entityType: 'user',
    entityId: userId,
    metadata: {
      updatedFields: Object.keys(input)
    }
  });

  return user;
}
export function usersService() {
  return {
    name: 'users-service-placeholder'
  };
}
