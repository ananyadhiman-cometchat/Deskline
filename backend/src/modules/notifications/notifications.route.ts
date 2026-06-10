import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateRequest } from '../../middleware/auth.js';
import { listNotificationsController, sendNotificationController } from './notifications.controller.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticateRequest);
notificationsRouter.get('/', asyncHandler(listNotificationsController));
notificationsRouter.post('/send', asyncHandler(sendNotificationController));