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
 * Handle message.sent: log activity, update ticket's last_activity_at,
 * and trigger AI response for AI-assisted conversations.
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

  // --- AI Agent auto-response for Information tickets ---
  // If this is an AI-assisted conversation (information subtype, no human agent yet),
  // and the message is NOT from the AI agent itself, generate a Gemini response.
  const aiAgentUid = process.env.COMETCHAT_AI_AGENT_UID;
  if (
    aiAgentUid &&
    payload.senderUid !== aiAgentUid &&
    ticket.subType === 'information' &&
    !ticket.agentId &&
    payload.messageType === 'text' &&
    payload.text
  ) {
    // Fire and forget — don't block webhook response
    void generateAndSendAIResponse(
      ticket.id,
      ticket.title,
      payload.conversationId,
      payload.text,
      aiAgentUid
    ).catch((err) => {
      console.error('[Webhook] AI response generation failed:', err instanceof Error ? err.message : err);
    });
  }
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

// ─── AI Agent Response Handler ───────────────────────────────────────────────

/**
 * Generate an AI response using Gemini and send it back to the CometChat
 * conversation as the AI Agent user.
 *
 * This is the core of Option B: webhook-driven AI.
 * Flow: Employee message → CometChat webhook → this function → Gemini → CometChat REST API
 */
async function generateAndSendAIResponse(
  ticketId: string,
  ticketTitle: string,
  conversationId: string,
  userMessage: string,
  aiAgentUid: string
): Promise<void> {
  const { generateTicketResponse } = await import('../ai/ai.service.js');
  const { getCometChatClient } = await import('./cometchat-client.js');

  // Fetch recent message history for context (last 5 messages from the ticket)
  const recentComments = await prisma.ticketComment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { body: true, isAi: true, createdAt: true },
  });

  // Build context from conversation history
  const historyContext = recentComments.length > 0
    ? recentComments
        .reverse()
        .map((c) => `${c.isAi ? 'AI' : 'Employee'}: ${c.body}`)
        .join('\n')
    : '';

  // Generate AI response using Gemini
  // We pass the latest user message as the "description" for the AI service
  const contextualPrompt = historyContext
    ? `Previous conversation:\n${historyContext}\n\nLatest message from employee: ${userMessage}`
    : userMessage;

  const aiResponse = await generateTicketResponse(ticketTitle, contextualPrompt);

  // Send the AI response into the CometChat group as the AI agent
  const client = getCometChatClient();
  await client.sendMessage(conversationId, aiResponse, aiAgentUid, 'group');

  // Also save the AI response as a ticket comment for history/fallback
  await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: aiAgentUid, // Using the AI agent UID as the user ID
      body: aiResponse,
      isAi: true,
    },
  });

  console.log(`[Webhook AI] AI response sent for ticket ${ticketId} in conversation ${conversationId}`);
}
