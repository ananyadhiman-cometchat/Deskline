import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas.js';
import { getCurrentUser, loginUser, logoutSession, refreshSession, registerUser } from './auth.service.js';

function parseBody<T>(schema: { parse: (value: unknown) => T }, body: unknown) {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(error.issues[0]?.message ?? 'Invalid request', 400);
    }

    throw error;
  }
}

function getRefreshTokenFromRequest(request: Request) {
  const bodyToken = typeof request.body?.refreshToken === 'string' ? request.body.refreshToken : null;
  const headerToken = request.headers['x-refresh-token'];

  if (bodyToken) {
    return bodyToken;
  }

  if (typeof headerToken === 'string' && headerToken.length > 0) {
    return headerToken;
  }

  throw new AppError('Refresh token required', 400);
}

export async function registerController(request: Request, response: Response) {
  const payload = parseBody(registerSchema, request.body);
  const result = await registerUser(payload);

  response.status(201).json(result);
}

export async function loginController(request: Request, response: Response) {
  const payload = parseBody(loginSchema, request.body);
  const result = await loginUser(payload);

  response.json(result);
}

export async function logoutController(request: Request, response: Response) {
  const refreshToken = getRefreshTokenFromRequest(request);
  const result = await logoutSession(refreshToken);

  response.json(result);
}

export async function refreshController(request: Request, response: Response) {
  const payload = parseBody(refreshSchema, request.body);
  const result = await refreshSession(payload.refreshToken);

  response.json(result);
}

export async function meController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await getCurrentUser(request.user.id);

  response.json({ user });
}
