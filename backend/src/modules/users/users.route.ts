import { Router } from 'express';

import { requirePermission, authenticateRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import {
  createUserController,
  deactivateUserController,
  listUsersController,
  updateUserController
} from './users.controller.js';

export const adminUsersRouter = Router();

adminUsersRouter.use(authenticateRequest, requirePermission('users:manage'));
adminUsersRouter.get('/', asyncHandler(listUsersController));
adminUsersRouter.post('/', asyncHandler(createUserController));
adminUsersRouter.patch('/:id', asyncHandler(updateUserController));
adminUsersRouter.patch('/:id/deactivate', asyncHandler(deactivateUserController));
