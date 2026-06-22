import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAIAgentConversation, handleHumanHelpRequest } from '../cometchat-ai.service.js';

// Mock prisma
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    ticket: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Mock CometChat client
const mockClient = {
  createOneOnOneConversation: vi.fn(),
  sendMessage: vi.fn(),
  createAuthToken: vi.fn(),
  createUser: vi.fn(),
  createUsers: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  setUserTags: vi.fn(),
  createGroup: vi.fn(),
  addMembersToGroup: vi.fn(),
};

vi.mock('../cometchat-client.js', () => ({
  getCometChatClient: () => mockClient,
}));

import { prisma } from '../../../lib/prisma.js';

describe('cometchat-ai.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, COMETCHAT_AI_AGENT_UID: 'ai-agent-uid-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAIAgentConversation', () => {
    it('creates a conversation between AI agent and employee, stores conversationId', async () => {
      mockClient.createOneOnOneConversation.mockResolvedValue({
        conversationId: 'conv-abc-123',
      });
      mockClient.sendMessage.mockResolvedValue(undefined);
      vi.mocked(prisma.ticket.update).mockResolvedValue({} as any);

      const result = await createAIAgentConversation('ticket-1', 'employee-uid');

      expect(result).toBe('conv-abc-123');
      expect(mockClient.createOneOnOneConversation).toHaveBeenCalledWith(
        'ai-agent-uid-123',
        'employee-uid'
      );
      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        'employee-uid',
        expect.stringContaining('AI assistant'),
        'ai-agent-uid-123'
      );
      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: 'ticket-1' },
        data: { cometchatConvoId: 'conv-abc-123' },
      });
    });

    it('returns null when COMETCHAT_AI_AGENT_UID is not configured', async () => {
      delete process.env.COMETCHAT_AI_AGENT_UID;

      const result = await createAIAgentConversation('ticket-1', 'employee-uid');

      expect(result).toBeNull();
      expect(mockClient.createOneOnOneConversation).not.toHaveBeenCalled();
    });

    it('returns null and logs error when conversation creation fails', async () => {
      mockClient.createOneOnOneConversation.mockRejectedValue(
        new Error('CometChat API error')
      );
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createAIAgentConversation('ticket-1', 'employee-uid');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CometChat AI]'),
        'ticket-1',
        'CometChat API error'
      );
      consoleSpy.mockRestore();
    });

    it('returns null when sendMessage fails after conversation created', async () => {
      mockClient.createOneOnOneConversation.mockResolvedValue({
        conversationId: 'conv-xyz',
      });
      mockClient.sendMessage.mockRejectedValue(new Error('Send failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createAIAgentConversation('ticket-1', 'employee-uid');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });

    it('returns null when prisma update fails', async () => {
      mockClient.createOneOnOneConversation.mockResolvedValue({
        conversationId: 'conv-xyz',
      });
      mockClient.sendMessage.mockResolvedValue(undefined);
      vi.mocked(prisma.ticket.update).mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createAIAgentConversation('ticket-1', 'employee-uid');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('handleHumanHelpRequest', () => {
    it('sends a handoff message to the employee', async () => {
      vi.mocked(prisma.ticket.findUnique)
        .mockResolvedValueOnce({ id: 'ticket-1', cometchatConvoId: 'conv-ai-123' } as any)
        .mockResolvedValueOnce({ employeeId: 'employee-uid-456' } as any);
      mockClient.sendMessage.mockResolvedValue(undefined);

      await handleHumanHelpRequest('ticket-1');

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        'employee-uid-456',
        expect.stringContaining('human agent'),
        'ai-agent-uid-123'
      );
    });

    it('does nothing when ticket is not found', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await handleHumanHelpRequest('nonexistent-ticket');

      expect(mockClient.sendMessage).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ticket not found'),
        'nonexistent-ticket'
      );
      warnSpy.mockRestore();
    });

    it('does nothing when ticket has no cometchatConvoId', async () => {
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        id: 'ticket-1',
        cometchatConvoId: null,
      } as any);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await handleHumanHelpRequest('ticket-1');

      expect(mockClient.sendMessage).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No AI conversation'),
        'ticket-1'
      );
      warnSpy.mockRestore();
    });

    it('does not throw when sendMessage fails during handoff', async () => {
      vi.mocked(prisma.ticket.findUnique)
        .mockResolvedValueOnce({ id: 'ticket-1', cometchatConvoId: 'conv-ai-123' } as any)
        .mockResolvedValueOnce({ employeeId: 'employee-uid-456' } as any);
      mockClient.sendMessage.mockRejectedValue(new Error('Send failed'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw — graceful degradation
      await expect(handleHumanHelpRequest('ticket-1')).resolves.toBeUndefined();
      warnSpy.mockRestore();
    });

    it('does not throw when AI Agent UID is not configured', async () => {
      delete process.env.COMETCHAT_AI_AGENT_UID;
      vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
        id: 'ticket-1',
        cometchatConvoId: 'conv-ai-123',
      } as any);

      // Should not throw even without AI Agent UID
      await expect(handleHumanHelpRequest('ticket-1')).resolves.toBeUndefined();
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('does not throw on unexpected database errors', async () => {
      vi.mocked(prisma.ticket.findUnique).mockRejectedValue(new Error('DB down'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(handleHumanHelpRequest('ticket-1')).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CometChat AI]'),
        'ticket-1',
        'DB down'
      );
      errorSpy.mockRestore();
    });
  });
});
