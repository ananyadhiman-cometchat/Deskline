import { Router } from 'express';

import { requirePermission, authenticateRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import {
  createUserController,
  deactivateUserController,
  listUsersController,
  updateUserController
} from './users.controller.js';
import { updateFcmTokenController } from './users.controller.js';
import { getProfileController, updateProfileController } from './users.controller.js';

export const adminUsersRouter = Router();

adminUsersRouter.use(authenticateRequest, requirePermission('users:manage'));
adminUsersRouter.get('/', asyncHandler(listUsersController));
adminUsersRouter.post('/', asyncHandler(createUserController));
adminUsersRouter.patch('/:id', asyncHandler(updateUserController));
adminUsersRouter.patch('/:id/deactivate', asyncHandler(deactivateUserController));

export const userProfileRouter = Router();
userProfileRouter.use(authenticateRequest);
userProfileRouter.patch('/me/fcm-token', asyncHandler(updateFcmTokenController));
userProfileRouter.get('/profile', asyncHandler(getProfileController));
userProfileRouter.patch('/profile', asyncHandler(updateProfileController));
