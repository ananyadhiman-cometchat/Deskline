import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketStatus } from '../../../../generated/prisma/client.js';

// Mock prisma
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock cometchat-client
vi.mock('../cometchat-client.js', () => ({
  getCometChatClient: vi.fn(() => ({
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { prisma } from '../../../lib/prisma.js';
import { getCometChatClient } from '../cometchat-client.js';
import {
  endConversation,
  reactivateConversation,
  onTicketStatusChange,
} from '../cometchat-lifecycle.service.js';

describe('cometchat-lifecycle.service', () => {
  let mockClient: {
    deleteConversation: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      deleteConversation: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(getCometChatClient).mockReturnValue(mockClient as any);
  });

  describe('endConversation', () => {
    it('calls deleteConversation on the CometChat client', async () => {
      await endConversation('conv-123');

      expect(mockClient.deleteConversation).toHaveBeenCalledWith('conv-123');
    });

    it('does not throw when deleteConversation fails', async () => {
      mockClient.deleteConversation.mockRejectedValue(new Error('API error'));

      await expect(endConversation('conv-123')).resolves.toBeUndefined();
    });

    it('logs an error when deleteConversation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockClient.deleteConversation.mockRejectedValue(new Error('API error'));

      await endConversation('conv-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to end conversation conv-123'),
        'API error'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('reactivateConversation', () => {
    it('sends a reactivation message when ticket and agent exist', async () => {
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
        employeeId: 'emp-1',
        agentId: 'agent-1',
      } as any);

      await reactivateConversation('conv-456');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        'agent-1',
        'Conversation reactivated — ticket has been reopened.',
        'emp-1'
      );
    });

    it('does not throw when no ticket is found', async () => {
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue(null);

      await expect(reactivateConversation('conv-456')).resolves.toBeUndefined();
    });

    it('does not throw when no agent is assigned', async () => {
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
        employeeId: 'emp-1',
        agentId: null,
      } as any);

      await expect(reactivateConversation('conv-456')).resolves.toBeUndefined();
    });

    it('does not throw when sendMessage fails', async () => {
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
        employeeId: 'emp-1',
        agentId: 'agent-1',
      } as any);
      mockClient.sendMessage.mockRejectedValue(new Error('Network error'));

      await expect(reactivateConversation('conv-456')).resolves.toBeUndefined();
    });
  });

  describe('onTicketStatusChange', () => {
    it('ends conversation when ticket transitions to closed', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.resolved, TicketStatus.closed);

      expect(mockClient.deleteConversation).toHaveBeenCalledWith('conv-789');
    });

    it('keeps conversation active when ticket is resolved (24h window)', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.in_progress, TicketStatus.resolved);

      expect(mockClient.deleteConversation).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('reactivates conversation when reopened from resolved to in_progress', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
        employeeId: 'emp-1',
        agentId: 'agent-1',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.resolved, TicketStatus.in_progress);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        'agent-1',
        'Conversation reactivated — ticket has been reopened.',
        'emp-1'
      );
    });

    it('reactivates conversation when reopened from resolved to open', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);
      vi.mocked(prisma.ticket.findFirst).mockResolvedValue({
        employeeId: 'emp-1',
        agentId: 'agent-1',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.resolved, TicketStatus.open);

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        'agent-1',
        'Conversation reactivated — ticket has been reopened.',
        'emp-1'
      );
    });

    it('does nothing when ticket has no cometchatConvoId', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: null,
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.open, TicketStatus.in_progress);

      expect(mockClient.deleteConversation).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('does nothing when ticket is not found', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);

      await onTicketStatusChange('ticket-1', TicketStatus.open, TicketStatus.in_progress);

      expect(mockClient.deleteConversation).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('keeps conversation active during open status', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.open, TicketStatus.open);

      expect(mockClient.deleteConversation).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('keeps conversation active during in_progress status', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        cometchatConvoId: 'conv-789',
      } as any);

      await onTicketStatusChange('ticket-1', TicketStatus.open, TicketStatus.in_progress);

      expect(mockClient.deleteConversation).not.toHaveBeenCalled();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('does not throw on unexpected errors', async () => {
      vi.mocked(prisma.ticket.findUnique).mockRejectedValue(new Error('DB down'));

      await expect(
        onTicketStatusChange('ticket-1', TicketStatus.open, TicketStatus.closed)
      ).resolves.toBeUndefined();
    });
  });
});
