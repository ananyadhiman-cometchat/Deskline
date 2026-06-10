import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '@prisma/client';

import { hasPermission, type Permission } from '../config/rbac.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/token.js';

function getBearerToken(request: Request) {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length);
}

export async function authenticateRequest(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
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
      }
    });

    if (!user || !user.isActive) {
      throw new AppError('Account is inactive', 403);
    }

    req.user = user;
    req.authToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
}
