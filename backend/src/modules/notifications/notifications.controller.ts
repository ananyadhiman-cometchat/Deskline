import type { Request, Response } from 'express';
import { AppError } from '../../lib/errors.js';
import { getUserNotifications } from './notifications.service.js';
import { createNotificationRecord } from './notifications.service.js';

export async function listNotificationsController(request: Request, response: Response) {
  if (!request.user) throw new AppError('Authentication required', 401);

  const notifications = await getUserNotifications(request.user.id);

  response.json({ data: notifications, meta: { total: notifications.length } });
}

export async function sendNotificationController(request: Request, response: Response) {
  const notification = await createNotificationRecord({
    actorId: request.user!.id,
    userId: request.body.userId,
    type: request.body.type,
    title: request.body.title,
    body: request.body.body
  });
  response.json({ data: notification });
}