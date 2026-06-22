import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { getCometChatClient } from './cometchat-client.js';
import type { GroupMember } from './cometchat.types.js';

/**
 * CometChat Chat Service
 *
 * ALL ticket conversations use private groups (never 1:1).
 * This ensures:
 * - Admins/supervisors can join any conversation at any time
 * - History is preserved when new members are added
 * - Consistent rendering on the frontend (always group mode)
 *
 * Group naming convention: `ticket-{ticketId}`
 */

/**
 * Create a private CometChat group when an agent claims a Conversation/Action ticket.
 *
 * Creates a 2-member group (employee + agent). Additional members (admin, supervisor)
 * can be added later via `addMemberToTicketGroup`.
 */
export async function createTicketConversation(
  ticketId: string,
  employeeUid: string,
  agentUid: string
): Promise<string | null> {
  try {
    const client = getCometChatClient();

    const guid = `ticket-${ticketId}`;
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { title: true },
    });
    const groupName = ticket?.title
      ? `${ticket.title.slice(0, 40)}`
      : `Ticket ${ticketId.slice(0, 8)}`;

    await client.createGroup({
      guid,
      name: groupName,
      type: 'private',
      metadata: { ticketId },
      tags: ['ticket-conversation'],
    });

    // Add both parties as members
    const members: GroupMember[] = [
      { uid: employeeUid, scope: 'participant' },
      { uid: agentUid, scope: 'admin' },
    ];

    await client.addMembersToGroup(guid, members);

    // Store the group ID on the ticket
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { cometchatConvoId: guid },
    });

    // Send an initial system message
    await client.sendMessage(guid, 'Conversation started', agentUid, 'group').catch(() => {
      // Non-critical — group is created even if initial message fails
    });

    return guid;
  } catch (error) {
    console.error(
      `[ChatService] Failed to create ticket group for ticket ${ticketId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Create a CometChat group for an escalation ticket.
 *
 * Creates a private group and adds members:
 * - Employee + Supervisor (direct escalation, no prior agent) → 2 members
 * - Employee + Supervisor + Agent (escalation from existing conversation) → 3 members
 */
export async function createEscalationGroup(
  ticketId: string,
  employeeUid: string,
  supervisorUid: string,
  agentUid?: string
): Promise<string | null> {
  try {
    const client = getCometChatClient();

    const guid = `ticket-${ticketId}`;
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { title: true },
    });
    const groupName = ticket?.title
      ? `Escalation: ${ticket.title.slice(0, 30)}`
      : `Escalation: Ticket ${ticketId.slice(0, 8)}`;

    await client.createGroup({
      guid,
      name: groupName,
      type: 'private',
      metadata: { ticketId, escalation: true },
      tags: ['escalation'],
    });

    // Build membership list
    const members: GroupMember[] = [
      { uid: employeeUid, scope: 'participant' },
      { uid: supervisorUid, scope: 'admin' },
    ];

    if (agentUid) {
      members.push({ uid: agentUid, scope: 'participant' });
    }

    await client.addMembersToGroup(guid, members);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { cometchatConvoId: guid },
    });

    return guid;
  } catch (error) {
    console.error(
      `[ChatService] Failed to create escalation group for ticket ${ticketId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Create a CometChat group for an Information ticket (employee + AI Agent).
 *
 * When a human agent is later assigned via "request human help",
 * they are added to this same group — preserving the AI conversation history.
 */
export async function createAIConversation(
  ticketId: string,
  employeeUid: string
): Promise<string | null> {
  try {
    const aiAgentUid = env.COMETCHAT_AI_AGENT_UID ?? 'deskline-ai-agent';
    const client = getCometChatClient();

    const guid = `ticket-${ticketId}`;
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { title: true },
    });
    const groupName = ticket?.title
      ? `${ticket.title.slice(0, 40)}`
      : `Ticket ${ticketId.slice(0, 8)}`;

    await client.createGroup({
      guid,
      name: groupName,
      type: 'private',
      metadata: { ticketId, aiAssisted: true },
      tags: ['ticket-conversation', 'ai-assisted'],
    });

    const members: GroupMember[] = [
      { uid: employeeUid, scope: 'participant' },
      { uid: aiAgentUid, scope: 'admin' },
    ];

    await client.addMembersToGroup(guid, members);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { cometchatConvoId: guid },
    });

    return guid;
  } catch (error) {
    console.error(
      `[ChatService] Failed to create AI conversation group for ticket ${ticketId}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Add a member to an existing ticket's CometChat group.
 *
 * Used when:
 * - An admin/supervisor intercepts a conversation
 * - A human agent is assigned after AI handoff
 *
 * Safe to call if the member is already in the group (CometChat no-ops).
 */
export async function addMemberToTicketGroup(
  ticketId: string,
  memberUid: string,
  scope: 'admin' | 'moderator' | 'participant' = 'participant'
): Promise<boolean> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { cometchatConvoId: true },
    });

    if (!ticket?.cometchatConvoId) {
      console.warn(`[ChatService] No group found for ticket ${ticketId} — cannot add member`);
      return false;
    }

    const client = getCometChatClient();
    await client.addMembersToGroup(ticket.cometchatConvoId, [{ uid: memberUid, scope }]);

    return true;
  } catch (error) {
    console.error(
      `[ChatService] Failed to add member ${memberUid} to ticket ${ticketId} group:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
