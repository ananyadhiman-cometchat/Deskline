import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors.js';
import { ensureUserAndGenerateToken } from './cometchat-auth.service.js';

/**
 * POST /api/cometchat/auth-token
 *
 * Generates a CometChat auth token for the authenticated user.
 * If the user doesn't exist in CometChat yet, syncs them first.
 *
 * Supports token refresh: clients call this endpoint whenever their
 * existing CometChat token becomes invalid, without re-login.
 */
export async function getAuthTokenController(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  const token = await ensureUserAndGenerateToken(req.user.id);

  res.json({ cometchatAuthToken: token, authToken: token });
}
