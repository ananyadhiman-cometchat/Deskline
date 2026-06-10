import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import { createUserSchema, updateUserSchema, userListQuerySchema } from './users.schemas.js';
import { createUser, deactivateUser, listUsers, updateUser } from './users.service.js';

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

export async function listUsersController(request: Request, response: Response) {
  const query = parseBody(userListQuerySchema, request.query);
  const result = await listUsers(query);

  response.json(result);
}

export async function createUserController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401);
  }

  const payload = parseBody(createUserSchema, request.body);
  const result = await createUser({ ...payload, actorId: request.user.id });

  response.status(201).json({ user: result });
}

export async function updateUserController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401);
  }

  const payload = parseBody(updateUserSchema, request.body);
  const result = await updateUser(request.params.id, { ...payload, actorId: request.user.id });

  response.json({ user: result });
}

export async function deactivateUserController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401);
  }

  const result = await deactivateUser(request.params.id, request.user.id);

  response.json({ user: result });
}
