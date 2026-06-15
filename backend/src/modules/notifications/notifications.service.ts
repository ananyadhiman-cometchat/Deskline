import type { NotificationType, Prisma } from '@prisma/client';

import { AppError } from '../../lib/errors.js';
import { sendPushNotification } from '../../lib/firebase.js';
import { prisma } from '../../lib/prisma.js';

type NotificationClient = Pick<Prisma.TransactionClient, 'notification' | 'user' | 'activityLog'>;

export async function createNotification(
  client: NotificationClient,
  input: {
    actorId: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }
) {
  const recipient = await client.user.findUnique({
    where: { id: input.userId },
    select: { id: true, fcmToken: true }
  });

  if (!recipient) {
    throw new AppError('Recipient not found', 404, 'RECIPIENT_NOT_FOUND');
  }

  const notification = await client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body
    }
  });

  await client.activityLog.create({
    data: {
      userId: input.actorId,
      action: 'notification_sent',
      entityType: 'notification',
      entityId: notification.id,
      metadata: {
        type: input.type,
        recipientId: input.userId,
        ...(input.metadata ?? {})
      }
    }
  });

  if (recipient.fcmToken) {
    await sendPushNotification(recipient.fcmToken, input.title, input.body).catch((err) => {
      console.error('FCM push failed (non-fatal):', err?.message ?? err);
      return null;
    });
  }

  return notification;
}

export async function getUserNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });

  return notifications;
}

export async function createNotificationRecord(input: {
  actorId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  return createNotification(prisma, input);
}
