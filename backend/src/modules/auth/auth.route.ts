import { Router } from 'express';

import { authenticateRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { loginController, logoutController, meController, refreshController, registerController } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(registerController));
authRouter.post('/login', asyncHandler(loginController));
authRouter.post('/logout', asyncHandler(logoutController));
authRouter.post('/refresh', asyncHandler(refreshController));
authRouter.get('/me', authenticateRequest, asyncHandler(meController));
