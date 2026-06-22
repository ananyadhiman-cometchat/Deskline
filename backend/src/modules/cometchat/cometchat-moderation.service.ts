import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { getCometChatClient } from './cometchat-client.js';

/**
 * Moderation queue service for handling AI-flagged messages.
 *
 * Provides operations to list, dismiss, and block senders of flagged messages.
 * Admin-only access is enforced at the route/middleware layer, not here.
 */

export interface ModerationFilters {
  page?: number;
  limit?: number;
}

export interface PaginatedModerationResult {
  items: Awaited<ReturnType<typeof prisma.moderationQueueItem.findMany>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * List flagged messages in the moderation queue with status = pending.
 * Returns paginated results.
 */
export async function listFlagged(
  filters: ModerationFilters = {}
): Promise<PaginatedModerationResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = { status: 'pending' as const };

  const [items, total] = await Promise.all([
    prisma.moderationQueueItem.findMany({
      where,
      orderBy: { flaggedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.moderationQueueItem.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Dismiss a flagged moderation queue item.
 * Updates status to dismissed, records who reviewed it and when,
 * and logs the action in the activity log.
 */
export async function dismissItem(id: string, adminId: string) {
  const item = await prisma.moderationQueueItem.update({
    where: { id },
    data: {
      status: 'dismissed',
      action: 'dismiss',
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  await recordActivityLog({
    userId: adminId,
    action: 'moderation_dismiss',
    entityType: 'moderation_queue',
    entityId: id,
    metadata: {
      messageId: item.messageId,
      senderUid: item.senderUid,
      conversationId: item.conversationId,
    },
  });

  return item;
}

/**
 * Block the sender of a flagged message.
 * Deactivates the sender's CometChat account, updates status to blocked,
 * records review details, and logs the action in the activity log.
 */
export async function blockSender(id: string, adminId: string) {
  const item = await prisma.moderationQueueItem.findUniqueOrThrow({
    where: { id },
  });

  // Deactivate the sender's CometChat account
  const client = getCometChatClient();
  await client.deleteUser(item.senderUid);

  // Update the moderation queue item
  const updatedItem = await prisma.moderationQueueItem.update({
    where: { id },
    data: {
      status: 'blocked',
      action: 'block_sender',
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  await recordActivityLog({
    userId: adminId,
    action: 'moderation_block_sender',
    entityType: 'moderation_queue',
    entityId: id,
    metadata: {
      messageId: item.messageId,
      senderUid: item.senderUid,
      senderName: item.senderName,
      conversationId: item.conversationId,
    },
  });

  return updatedItem;
}
