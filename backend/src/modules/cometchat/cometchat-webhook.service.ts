import crypto from 'crypto';

import { TicketStatus } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';
import type {
  WebhookEvent,
  MessageSentPayload,
  MessageFlaggedPayload,
  ConversationEndedPayload,
  CallEndedPayload,
} from './cometchat.types.js';

/**
 * Validate CometChat webhook signature using HMAC-SHA256.
 * Compares the computed signature against the provided one using timing-safe comparison.
 */
export function validateSignature(payload: string, signature: string): boolean {
  const secret = env.COMETCHAT_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] COMETCHAT_WEBHOOK_SECRET is not configured');
    return false;
  }

  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  if (computed.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

/**
 * Process an incoming CometChat webhook event.
 * Routes to the appropriate handler based on event type.
 * Uses idempotent processing — checks if event was already processed.
 */
export async function processEvent(event: WebhookEvent): Promise<void> {
  // Idempotency check: skip if already processed
  const existing = await prisma.webhookEventLog.findFirst({
    where: {
      id: event.id,
      status: 'processed',
    },
  });

  if (existing) {
    console.log(`[Webhook] Event ${event.id} already processed, skipping`);
    return;
  }

  // Log the event as received
  await prisma.webhookEventLog.upsert({
    where: { id: event.id },
    update: {},
    create: {
      id: event.id,
      eventType: event.eventType,
      payload: event.payload as any,
      status: 'received',
    },
  });

  try {
    switch (event.eventType) {
      case 'message.sent':
        await handleMessageSent(event.payload as MessageSentPayload);
        break;
      case 'conversation.ended':
        await handleConversationEnded(event.payload as ConversationEndedPayload);
        break;
      case 'message.flagged':
        await handleMessageFlagged(event.payload as MessageFlaggedPayload);
        break;
      case 'call.ended':
        await handleCallEnded(event.payload as CallEndedPayload);
        break;
      default:
        // Unknown event types are logged but not processed further
        console.log(`[Webhook] Unhandled event type: ${event.eventType}`);
        break;
    }

    // Mark event as processed
    await prisma.webhookEventLog.update({
      where: { id: event.id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    console.error(`[Webhook] Failed to process event ${event.id}:`, errorMessage);

    // Mark event as failed with error message
    await prisma.webhookEventLog.update({
      where: { id: event.id },
      data: {
        status: 'failed',
        errorMessage,
      },
    });

    throw error;
  }
}

/**
 * Retry a previously failed webhook event by ID.
 */
export async function retryEvent(eventId: string): Promise<void> {
  const eventLog = await prisma.webhookEventLog.findUnique({
    where: { id: eventId },
  });

  if (!eventLog) {
    throw new Error(`Webhook event ${eventId} not found`);
  }

  if (eventLog.status === 'processed') {
    throw new Error(`Webhook event ${eventId} is already processed`);
  }

  const event: WebhookEvent = {
    id: eventLog.id,
    eventType: eventLog.eventType as WebhookEvent['eventType'],
    timestamp: eventLog.createdAt.getTime(),
    appId: '',
    payload: eventLog.payload as any,
  };

  await processEvent(event);
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

/**
 * Handle message.sent: log activity and update ticket's last_activity_at.
 */
async function handleMessageSent(payload: MessageSentPayload): Promise<void> {
  // Find the ticket associated with this conversation
  const ticket = await prisma.ticket.findFirst({
    where: { cometchatConvoId: payload.conversationId },
  });

  if (!ticket) {
    console.log(`[Webhook] No ticket found for conversation ${payload.conversationId}`);
    return;
  }

  // Log the chat message activity
  await recordActivityLog({
    userId: payload.senderUid,
    action: 'chat_message_sent',
    entityType: 'ticket',
    entityId: ticket.id,
    metadata: {
      messageId: payload.messageId,
      conversationId: payload.conversationId,
      senderName: payload.senderName,
      messageType: payload.messageType,
    },
  });

  // Update ticket's last_activity_at
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { lastActivityAt: new Date(payload.sentAt) },
  });
}

/**
 * Handle conversation.ended: update ticket status to resolved and notify employee.
 */
async function handleConversationEnded(payload: ConversationEndedPayload): Promise<void> {
  const ticket = await prisma.ticket.findFirst({
    where: { cometchatConvoId: payload.conversationId },
  });

  if (!ticket) {
    console.log(`[Webhook] No ticket found for conversation ${payload.conversationId}`);
    return;
  }

  // Update ticket status to resolved
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: TicketStatus.resolved,
      resolvedAt: new Date(payload.endedAt),
    },
  });

  // Notify the employee that their ticket has been resolved
  await createNotification(prisma, {
    actorId: payload.endedBy,
    userId: ticket.employeeId,
    type: 'ticket_update',
    title: 'Ticket Resolved',
    body: `Your ticket "${ticket.title}" has been resolved via chat.`,
    metadata: {
      ticketId: ticket.id,
      conversationId: payload.conversationId,
    },
  });
}

/**
 * Handle message.flagged: create moderation queue entry and notify admins.
 */
async function handleMessageFlagged(payload: MessageFlaggedPayload): Promise<void> {
  // Find ticket for context (optional — flagged messages may not have a ticket)
  const ticket = await prisma.ticket.findFirst({
    where: { cometchatConvoId: payload.conversationId },
  });

  // Create moderation queue entry
  await prisma.moderationQueueItem.create({
    data: {
      messageId: payload.messageId,
      conversationId: payload.conversationId,
      ticketId: ticket?.id ?? null,
      senderUid: payload.senderUid,
      senderName: payload.senderName,
      messageContent: payload.messageContent,
      flagReason: payload.flagReason,
      flaggedAt: new Date(payload.flaggedAt),
    },
  });

  // Notify all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'admin', isActive: true },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification(prisma, {
        actorId: payload.senderUid,
        userId: admin.id,
        type: 'cometchat',
        title: 'Message Flagged',
        body: `A message from ${payload.senderName} has been flagged: ${payload.flagReason}`,
        metadata: {
          messageId: payload.messageId,
          conversationId: payload.conversationId,
          ticketId: ticket?.id,
          flagReason: payload.flagReason,
        },
      })
    )
  );
}

/**
 * Handle call.ended: log call activity.
 */
async function handleCallEnded(payload: CallEndedPayload): Promise<void> {
  // Find the ticket associated with this conversation
  const ticket = await prisma.ticket.findFirst({
    where: { cometchatConvoId: payload.conversationId },
  });

  if (!ticket) {
    console.log(`[Webhook] No ticket found for conversation ${payload.conversationId}`);
    return;
  }

  // Log call activity
  await recordActivityLog({
    userId: payload.callerUid,
    action: 'call_ended',
    entityType: 'ticket',
    entityId: ticket.id,
    metadata: {
      sessionId: payload.sessionId,
      conversationId: payload.conversationId,
      callerUid: payload.callerUid,
      calleeUid: payload.calleeUid,
      duration: payload.duration,
      status: payload.status,
    },
  });
}
