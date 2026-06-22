import { prisma } from '../../lib/prisma.js';
import { getCometChatClient } from './cometchat-client.js';
import { addMemberToTicketGroup } from './cometchat-chat.service.js';

/**
 * CometChat AI Agent Service
 *
 * Manages AI Agent conversations for information-type tickets.
 * Now uses groups (not 1:1) — when a human agent is assigned,
 * they're added to the SAME group so history is preserved.
 */

/**
 * Returns the configured AI Agent UID from environment.
 */
function getAIAgentUid(): string | null {
  return process.env.COMETCHAT_AI_AGENT_UID ?? null;
}

/**
 * Create a CometChat group between the employee and the AI Agent
 * for an information-type ticket.
 *
 * NOTE: This is now handled by createAIConversation in cometchat-chat.service.ts
 * which creates a group. This function is kept for backward compatibility but
 * delegates to the chat service.
 */
export async function createAIAgentConversation(
  ticketId: string,
  employeeUid: string
): Promise<string | null> {
  const aiAgentUid = getAIAgentUid();

  if (!aiAgentUid) {
    console.warn(
      '[CometChat AI] COMETCHAT_AI_AGENT_UID is not configured. Skipping AI conversation creation for ticket:',
      ticketId
    );
    return null;
  }

  try {
    // Use the group-based creation from chat service
    const { createAIConversation } = await import('./cometchat-chat.service.js');
    const groupId = await createAIConversation(ticketId, employeeUid);

    if (groupId) {
      // Send greeting from AI Agent into the group
      const client = getCometChatClient();
      await client.sendMessage(
        groupId,
        'Hello! I\'m your AI assistant. How can I help you today? If you need to speak with a human agent at any time, just let me know.',
        aiAgentUid,
        'group'
      ).catch(() => {
        // Non-critical
      });
    }

    return groupId;
  } catch (error) {
    console.error(
      '[CometChat AI] Failed to create AI agent conversation for ticket:',
      ticketId,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Handle the transition from AI Agent conversation to human agent.
 *
 * Instead of creating a new conversation, we ADD the human agent to
 * the existing group. This preserves full AI conversation history
 * so the human agent can see what was already discussed.
 */
export async function handleHumanHelpRequest(ticketId: string): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, cometchatConvoId: true, employeeId: true, agentId: true },
    });

    if (!ticket) {
      console.warn('[CometChat AI] Ticket not found for human help request:', ticketId);
      return;
    }

    if (!ticket.cometchatConvoId) {
      console.warn('[CometChat AI] No conversation found on ticket for human help request:', ticketId);
      return;
    }

    // Send a handoff message from the AI Agent
    const aiAgentUid = getAIAgentUid();
    if (aiAgentUid) {
      try {
        const client = getCometChatClient();
        await client.sendMessage(
          ticket.cometchatConvoId,
          'I\'m connecting you with a human agent who will be able to help you further. They\'ll have access to our full conversation history.',
          aiAgentUid,
          'group'
        );
      } catch (msgError) {
        console.warn(
          '[CometChat AI] Failed to send handoff message for ticket:',
          ticketId,
          msgError instanceof Error ? msgError.message : msgError
        );
      }
    }

    // Add the human agent to the existing group (if one is already assigned)
    if (ticket.agentId) {
      await addMemberToTicketGroup(ticketId, ticket.agentId, 'admin');
    }
  } catch (error) {
    console.error(
      '[CometChat AI] Failed to handle human help request for ticket:',
      ticketId,
      error instanceof Error ? error.message : error
    );
  }
}
