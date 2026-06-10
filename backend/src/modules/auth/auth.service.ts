import { UserRole } from '@prisma/client';
import type { Department, Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { comparePassword, hashPassword } from '../../lib/password.js';
import {
  createRefreshToken,
  hashToken,
  parseDurationToMs,
  signAccessToken
} from '../../lib/token.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';

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

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

export function toSafeUser(user: Prisma.UserGetPayload<{ select: typeof safeUserSelect }>) {
  return user;
}

function buildTokens(user: SafeUser, refreshToken: string) {
  return {
    accessToken: signAccessToken({
      sub: user.id,
      role: user.role,
      department: user.department
    }),
    refreshToken
  };
}

async function createSession(userId: string) {
  const refreshToken = createRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

  const tokenRecord = await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return { refreshToken, tokenRecord };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  department: Department;
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
      role: UserRole.employee,
      department: input.department,
      isActive: true
    },
    select: safeUserSelect
  });

  const { refreshToken } = await createSession(user.id);

  await recordActivityLog({
    userId: user.id,
    action: 'user_registered',
    entityType: 'user',
    entityId: user.id,
    metadata: {
      role: user.role,
      department: user.department
    }
  });

  return {
    user: toSafeUser(user),
    ...buildTokens(user, refreshToken)
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastFailedLoginAt: new Date() }
    });

    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastFailedLoginAt: new Date() }
    });

    throw new AppError('Account is inactive', 403);
  }

  const safeUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastFailedLoginAt: null },
    select: safeUserSelect
  });

  const { refreshToken } = await createSession(user.id);

  await recordActivityLog({
    userId: user.id,
    action: 'user_logged_in',
    entityType: 'user',
    entityId: user.id,
    metadata: {
      role: user.role,
      department: user.department
    }
  });

  return {
    user: toSafeUser(safeUser),
    ...buildTokens(safeUser, refreshToken)
  };
}

export async function refreshSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: safeUserSelect
      }
    }
  });

  if (!existingToken || existingToken.revokedAt || existingToken.expiresAt <= new Date()) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (!existingToken.user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  const { refreshToken: newRefreshToken, tokenRecord } = await createSession(existingToken.userId);

  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: {
      revokedAt: new Date(),
      replacedById: tokenRecord.id
    }
  });

  return {
    user: toSafeUser(existingToken.user),
    ...buildTokens(existingToken.user, newRefreshToken)
  };
}

export async function logoutSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const existingToken = await prisma.refreshToken.findUnique({
    where: { tokenHash }
  });

  if (existingToken && !existingToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() }
    });

    await recordActivityLog({
      userId: existingToken.userId,
      action: 'user_logged_out',
      entityType: 'user',
      entityId: existingToken.userId,
      metadata: {}
    });
  }

  return { success: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  return toSafeUser(user);
}
export function authService() {
  return {
    name: 'auth-service-placeholder'
  };
}
