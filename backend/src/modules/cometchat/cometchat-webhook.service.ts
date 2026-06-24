import { TicketStatus } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';

// ─── Types matching actual CometChat webhook payload (latest, NOT legacy) ────

interface CometChatWebhookPayload {
  trigger: string;
  data: Record<string, any>;
  appId?: string;
  region?: string;
  webhook?: string;
  type?: string; // "call" | "meet" for call/meeting events
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Process an incoming CometChat webhook payload (latest format).
 *
 * CometChat sends:
 * {
 *   "trigger": "message_sent",
 *   "data": { "message": { id, conversationId, sender, receiver, ... } },
 *   "appId": "...",
 *   "webhook": "..."
 * }
 */
export async function processWebhookPayload(payload: CometChatWebhookPayload): Promise<void> {
  const { trigger, data } = payload;

  // Generate a unique event ID for idempotency (CometChat doesn't send one at the top level)
  const eventId = deriveEventId(trigger, data);

  // Idempotency: skip if already processed
  const existing = await prisma.webhookEventLog.findFirst({
    where: { id: eventId, status: 'processed' },
  });
  if (existing) {
    console.log(`[Webhook] Event ${eventId} already processed, skipping`);
    return;
  }

  // Log as received
  await prisma.webhookEventLog.upsert({
    where: { id: eventId },
    update: {},
    create: {
      id: eventId,
      eventType: trigger,
      payload: payload as any,
      status: 'received',
    },
  });

  try {
    switch (trigger) {
      case 'message_sent':
        await handleMessageSent(data);
        break;
      case 'moderation_engine_blocked':
        await handleModerationBlocked(data);
        break;
      case 'call_ended':
        await handleCallEnded(data);
        break;
      case 'meeting_ended':
        await handleCallEnded(data);
        break;
      default:
        console.log(`[Webhook] Unhandled trigger: ${trigger}`);
        break;
    }

    // Mark as processed
    await prisma.webhookEventLog.update({
      where: { id: eventId },
      data: { status: 'processed', processedAt: new Date() },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook] Failed to process ${trigger} (${eventId}):`, errorMessage);

    await prisma.webhookEventLog.update({
      where: { id: eventId },
      data: { status: 'failed', errorMessage },
    });
  }
}

/**
 * Retry a previously failed webhook event.
 */
export async function retryEvent(eventId: string): Promise<void> {
  const eventLog = await prisma.webhookEventLog.findUnique({
    where: { id: eventId },
  });

  if (!eventLog) throw new Error(`Webhook event ${eventId} not found`);
  if (eventLog.status === 'processed') throw new Error(`Event ${eventId} already processed`);

  const payload = eventLog.payload as unknown as CometChatWebhookPayload;
  await processWebhookPayload(payload);
}

// Keep legacy export for the moderation route that uses it
export function validateSignature(_payload: string, _signature: string): boolean {
  // CometChat latest webhooks use Basic Auth, not HMAC signatures.
  // This is kept for backward compatibility but always returns true.
  return true;
}

// Legacy export for backward compat (admin retry route)
export { processWebhookPayload as processEvent };

// ─── Event Handlers ──────────────────────────────────────────────────────────

/**
 * Handle message_sent — the most important trigger for AI Agent.
 *
 * Actual payload shape:
 * { "message": { "id", "conversationId", "sender", "receiverType",
 *   "receiver", "category", "type", "data": { "text", ... }, "sentAt" } }
 */
async function handleMessageSent(data: Record<string, any>): Promise<void> {
  const message = data.message;
  if (!message) {
    console.warn('[Webhook] message_sent: no message field in data');
    return;
  }

  const messageId = String(message.id);
  const conversationId = message.conversationId as string;
  const senderUid = message.sender as string;
  const senderName = message.data?.entities?.sender?.entity?.name ?? senderUid;
  const messageType = message.type as string; // "text", "image", etc.
  const text = message.data?.text as string | undefined;
  const sentAt = message.sentAt as number;
  const receiverType = message.receiverType as string; // "user" | "group"
  const receiver = message.receiver as string;

  // For group messages, the conversationId is "group_<guid>".
  // Our tickets store cometchatConvoId as just the guid (e.g., "ticket-abc123").
  // Try both the raw conversationId and the receiver (group guid) for lookup.
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { cometchatConvoId: conversationId },
        { cometchatConvoId: receiver },
        // CometChat prefixes group conversations with "group_"
        ...(conversationId.startsWith('group_')
          ? [{ cometchatConvoId: conversationId.replace('group_', '') }]
          : []),
      ],
    },
  });

  if (!ticket) {
    console.log(`[Webhook] message_sent: No ticket for conversation=${conversationId} receiver=${receiver}`);
    return;
  }

  // Log activity
  await recordActivityLog({
    userId: senderUid,
    action: 'chat_message_sent',
    entityType: 'ticket',
    entityId: ticket.id,
    metadata: { messageId, conversationId, senderName, messageType },
  });

  // Update ticket last_activity_at
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { lastActivityAt: new Date(sentAt * 1000) },
  });

  // --- AI Agent auto-response for Information tickets ---
  const aiAgentUid = process.env.COMETCHAT_AI_AGENT_UID;
  if (
    aiAgentUid &&
    senderUid !== aiAgentUid &&
    ticket.subType === 'information' &&
    !ticket.agentId &&
    messageType === 'text' &&
    text
  ) {
    void generateAndSendAIResponse(
      ticket.id,
      ticket.title,
      ticket.cometchatConvoId!,
      text,
      aiAgentUid
    ).catch((err) => {
      console.error('[Webhook] AI response failed:', err instanceof Error ? err.message : err);
    });
  }
}

/**
 * Handle moderation_engine_blocked — message flagged by AI moderation.
 *
 * Payload shape:
 * { "message": { "id", "conversationId", "sender", "data": { "text", "moderation": {...} } },
 *   "moderation": [{ "condition": {...}, "rule": { "id", "name", ... } }] }
 */
async function handleModerationBlocked(data: Record<string, any>): Promise<void> {
  const message = data.message;
  const moderationRules = data.moderation as Array<{ rule?: { name?: string }; condition?: { message?: string } }> | undefined;

  if (!message) {
    console.warn('[Webhook] moderation_engine_blocked: no message field');
    return;
  }

  const messageId = String(message.id);
  const conversationId = message.conversationId as string;
  const senderUid = message.sender as string;
  const senderName = message.data?.entities?.sender?.entity?.name ?? senderUid;
  const messageContent = message.data?.text ?? '[non-text message]';
  const flagReason = moderationRules?.[0]?.rule?.name
    ?? moderationRules?.[0]?.condition?.message
    ?? 'Content moderation rule triggered';

  // Find associated ticket
  const receiver = message.receiver as string;
  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { cometchatConvoId: conversationId },
        { cometchatConvoId: receiver },
        ...(conversationId.startsWith('group_')
          ? [{ cometchatConvoId: conversationId.replace('group_', '') }]
          : []),
      ],
    },
  });

  // Create moderation queue entry
  await prisma.moderationQueueItem.create({
    data: {
      messageId,
      conversationId,
      ticketId: ticket?.id ?? null,
      senderUid,
      senderName,
      messageContent,
      flagReason,
      flaggedAt: new Date(),
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: 'admin', isActive: true },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification(prisma, {
        actorId: senderUid,
        userId: admin.id,
        type: 'cometchat',
        title: 'Message Flagged',
        body: `A message from ${senderName} was blocked: ${flagReason}`,
        metadata: { messageId, conversationId, ticketId: ticket?.id, flagReason },
      })
    )
  );
}

/**
 * Handle call_ended / meeting_ended — log call activity.
 *
 * Payload shape:
 * { "all_occupants": [...], "destroyed_at": number, "created_at": number, "sessionId": "..." }
 */
async function handleCallEnded(data: Record<string, any>): Promise<void> {
  const sessionId = data.sessionId as string | undefined;
  if (!sessionId) {
    console.log('[Webhook] call/meeting_ended: no sessionId');
    return;
  }

  const allOccupants = data.all_occupants as Array<{ name?: string; joined_at?: number; left_at?: number }> | undefined;
  const createdAt = data.created_at as number | undefined;
  const destroyedAt = data.destroyed_at as number | undefined;
  const duration = createdAt && destroyedAt ? destroyedAt - createdAt : 0;

  // Try to find a ticket by sessionId (our groups use ticket-based GUIDs)
  const ticket = await prisma.ticket.findFirst({
    where: { cometchatConvoId: sessionId },
  });

  if (!ticket) {
    console.log(`[Webhook] call_ended: No ticket for sessionId=${sessionId}`);
    return;
  }

  const callerName = allOccupants?.[0]?.name ?? 'Unknown';

  await recordActivityLog({
    userId: callerName,
    action: 'call_ended',
    entityType: 'ticket',
    entityId: ticket.id,
    metadata: {
      sessionId,
      duration,
      participants: allOccupants?.map((o) => o.name).filter(Boolean),
    },
  });
}

// ─── AI Agent Response Handler ───────────────────────────────────────────────

/**
 * Generate an AI response using Gemini and send it back to the CometChat
 * group conversation as the AI Agent user.
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

  // Fetch recent message history for context
  const recentComments = await prisma.ticketComment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { body: true, isAi: true, createdAt: true },
  });

  const historyContext = recentComments.length > 0
    ? recentComments
        .reverse()
        .map((c) => `${c.isAi ? 'AI' : 'Employee'}: ${c.body}`)
        .join('\n')
    : '';

  const contextualPrompt = historyContext
    ? `Previous conversation:\n${historyContext}\n\nLatest message from employee: ${userMessage}`
    : userMessage;

  const aiResponse = await generateTicketResponse(ticketTitle, contextualPrompt);

  // Send the AI response back to the CometChat group
  const client = getCometChatClient();
  await client.sendMessage(conversationId, aiResponse, aiAgentUid, 'group');

  // Save as ticket comment for history
  await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: aiAgentUid,
      body: aiResponse,
      isAi: true,
    },
  });

  console.log(`[Webhook AI] Response sent for ticket ${ticketId} in ${conversationId}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a unique event ID for idempotency based on CometChat's recommended keys.
 */
function deriveEventId(trigger: string, data: Record<string, any>): string {
  // Use CometChat's recommended idempotency keys per trigger type
  const webhook = 'deskline';

  switch (trigger) {
    case 'message_sent':
      return `${webhook}_${trigger}_${data.message?.id ?? Date.now()}`;
    case 'moderation_engine_blocked':
      return `${webhook}_${trigger}_${data.message?.id ?? Date.now()}_${data.message?.updatedAt ?? ''}`;
    case 'call_ended':
    case 'meeting_ended':
      return `${webhook}_${trigger}_${data.sessionId ?? Date.now()}_${data.destroyed_at ?? ''}`;
    default:
      return `${webhook}_${trigger}_${Date.now()}`;
  }
}
