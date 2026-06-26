/**
 * CometChat integration types for the DeskLine backend module.
 *
 * These types define the data structures used across the CometChat services:
 * auth, user sync, webhook processing, moderation, chat lifecycle, and AI agent.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ModerationStatus {
  pending = 'pending',
  dismissed = 'dismissed',
  blocked = 'blocked',
}

export enum ModerationAction {
  dismiss = 'dismiss',
  block_sender = 'block_sender',
}

export enum WebhookStatus {
  received = 'received',
  processed = 'processed',
  failed = 'failed',
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface CometChatUser {
  uid: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  role?: string;
  tags?: string[];
  createdAt?: number;
}

export interface CreateUserParams {
  uid: string;
  name: string;
  /** CometChat role ID (e.g. "admin", "supervisor", "agent", "employee"). */
  role?: string;
  avatar?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateUserParams {
  name?: string;
  /** CometChat role ID (e.g. "admin", "supervisor", "agent", "employee"). */
  role?: string;
  avatar?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// ─── Group Types ─────────────────────────────────────────────────────────────

export interface CreateGroupParams {
  guid: string;
  name: string;
  type: 'public' | 'private' | 'password';
  members?: GroupMember[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface GroupMember {
  uid: string;
  scope: 'admin' | 'moderator' | 'participant';
}

export interface CometChatGroup {
  guid: string;
  name: string;
  type: 'public' | 'private' | 'password';
  membersCount: number;
  createdAt?: number;
  tags?: string[];
}

// ─── AI Agent Types ──────────────────────────────────────────────────────────

export interface AIAgentConfig {
  agentId: string;
  name: string;
  instructions?: string;
  knowledgeBase?: string[];
  enabled: boolean;
}

// ─── Webhook Types ───────────────────────────────────────────────────────────

export type WebhookEventType =
  | 'message.sent'
  | 'message.flagged'
  | 'conversation.ended'
  | 'call.ended'
  | 'user.online'
  | 'user.offline';

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  timestamp: number;
  appId: string;
  payload: WebhookPayload;
}

export type WebhookPayload =
  | MessageSentPayload
  | MessageFlaggedPayload
  | ConversationEndedPayload
  | CallEndedPayload
  | UserStatusPayload;

export interface MessageSentPayload {
  messageId: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  messageType: string;
  text?: string;
  sentAt: number;
}

export interface MessageFlaggedPayload {
  messageId: string;
  conversationId: string;
  senderUid: string;
  senderName: string;
  messageContent: string;
  flagReason: string;
  flaggedAt: number;
}

export interface ConversationEndedPayload {
  conversationId: string;
  endedBy: string;
  endedAt: number;
}

export interface CallEndedPayload {
  sessionId: string;
  conversationId: string;
  callerUid: string;
  calleeUid: string;
  duration: number;
  status: 'completed' | 'missed' | 'declined';
  endedAt: number;
}

export interface UserStatusPayload {
  uid: string;
  status: 'online' | 'offline';
}

// ─── Sync Types ──────────────────────────────────────────────────────────────

export interface SyncResult {
  success: boolean;
  uid: string;
  error?: string;
  retryCount?: number;
}

export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
}
