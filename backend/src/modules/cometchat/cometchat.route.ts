import { Router } from 'express';

import { authenticateRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { getAuthTokenController } from './cometchat.controller.js';

export const cometchatRouter = Router();

/**
 * POST /api/cometchat/auth-token
 * JWT-authenticated, any role.
 * Generates (or refreshes) a CometChat auth token for the current user.
 */
cometchatRouter.post('/auth-token', authenticateRequest, asyncHandler(getAuthTokenController));
