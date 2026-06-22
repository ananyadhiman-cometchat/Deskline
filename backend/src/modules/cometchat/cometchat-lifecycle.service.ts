import { TicketStatus } from '../../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { getCometChatClient } from './cometchat-client.js';

/**
 * Chat Lifecycle Service
 *
 * Manages the CometChat conversation lifecycle in sync with ticket status transitions.
 * Conversations are ended when tickets close, kept active during resolution,
 * and reactivated when tickets are reopened after rejection.
 *
 * All operations log errors but do not throw — lifecycle management should never
 * break ticket operations.
 */

/**
 * End a CometChat conversation.
 *
 * Calls the CometChat REST API to delete/close the conversation.
 * Logs errors but does not throw — a failed end should not block ticket closure.
 *
 * @param conversationId - The CometChat conversation ID to end
 */
export async function endConversation(conversationId: string): Promise<void> {
  try {
    const client = getCometChatClient();
    await client.deleteConversation(conversationId);
    console.log(`[ChatLifecycle] Ended conversation: ${conversationId}`);
  } catch (error) {
    console.error(
      `[ChatLifecycle] Failed to end conversation ${conversationId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Reactivate a previously ended CometChat conversation.
 *
 * Sends a system message to re-establish the conversation. If the conversation
 * cannot be reactivated (e.g., permanently deleted), logs the error.
 *
 * @param conversationId - The CometChat conversation ID to reactivate
 */
export async function reactivateConversation(conversationId: string): Promise<void> {
  try {
    // Look up the ticket to find the participants for reactivation
    const ticket = await prisma.ticket.findFirst({
      where: { cometchatConvoId: conversationId },
      select: { employeeId: true, agentId: true },
    });

    if (!ticket) {
      console.error(
        `[ChatLifecycle] Cannot reactivate conversation ${conversationId}: no associated ticket found`
      );
      return;
    }

    if (!ticket.agentId) {
      console.error(
        `[ChatLifecycle] Cannot reactivate conversation ${conversationId}: no agent assigned`
      );
      return;
    }

    // Send a system message to the group to re-establish the conversation
    const client = getCometChatClient();
    await client.sendMessage(
      conversationId,
      'Conversation reactivated — ticket has been reopened.',
      ticket.employeeId,
      'group'
    );
    console.log(`[ChatLifecycle] Reactivated conversation: ${conversationId}`);
  } catch (error) {
    console.error(
      `[ChatLifecycle] Failed to reactivate conversation ${conversationId}:`,
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Handle ticket status transitions and sync chat lifecycle accordingly.
 *
 * Routing logic:
 * - Transition to "closed" → end conversation
 * - Transition to "resolved" → keep conversation open (employee has 24h to confirm)
 * - "open" or "in_progress" → keep active (no-op)
 * - Reopen after rejection (resolved → open/in_progress) → reactivate conversation
 *
 * @param ticketId - The DeskLine ticket ID
 * @param oldStatus - The previous ticket status
 * @param newStatus - The new ticket status
 */
export async function onTicketStatusChange(
  ticketId: string,
  oldStatus: TicketStatus,
  newStatus: TicketStatus
): Promise<void> {
  try {
    // Look up the ticket's CometChat conversation ID
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { cometchatConvoId: true },
    });

    if (!ticket?.cometchatConvoId) {
      // No conversation associated — nothing to do
      return;
    }

    const conversationId = ticket.cometchatConvoId;

    // Route based on the new status
    if (newStatus === TicketStatus.closed) {
      // Ticket closed → end conversation
      await endConversation(conversationId);
      return;
    }

    if (newStatus === TicketStatus.resolved) {
      // Ticket resolved → keep conversation open (24h window for employee to confirm)
      console.log(
        `[ChatLifecycle] Ticket ${ticketId} resolved — conversation ${conversationId} stays active (24h confirmation window)`
      );
      return;
    }

    // Reopen after rejection: resolved → open or in_progress
    if (
      oldStatus === TicketStatus.resolved &&
      (newStatus === TicketStatus.open || newStatus === TicketStatus.in_progress)
    ) {
      await reactivateConversation(conversationId);
      return;
    }

    // "open" or "in_progress" without coming from "resolved" — keep active (no-op)
    if (newStatus === TicketStatus.open || newStatus === TicketStatus.in_progress) {
      return;
    }
  } catch (error) {
    console.error(
      `[ChatLifecycle] Error handling status change for ticket ${ticketId} (${oldStatus} → ${newStatus}):`,
      error instanceof Error ? error.message : error
    );
  }
}
