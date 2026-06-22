import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    user: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock the cometchat client
vi.mock('../cometchat-client.js', () => ({
  getCometChatClient: vi.fn(),
  CometChatApiError: class CometChatApiError extends Error {
    statusCode: number | undefined;
    cometChatCode: string | undefined;
    endpoint: string;
    constructor(message: string, endpoint: string, statusCode?: number, cometChatCode?: string) {
      super(message);
      this.name = 'CometChatApiError';
      this.endpoint = endpoint;
      this.statusCode = statusCode;
      this.cometChatCode = cometChatCode;
    }
  },
}));

import { prisma } from '../../../lib/prisma.js';
import { getCometChatClient } from '../cometchat-client.js';
import {
  syncNewUser,
  batchSyncUsers,
  updateUserTags,
  retryPendingSync,
} from '../cometchat-sync.service.js';
import type { DesklineUser } from '../cometchat-sync.service.js';

describe('cometchat-sync.service', () => {
  const mockClient = {
    createUser: vi.fn(),
    createUsers: vi.fn(),
    setUserTags: vi.fn(),
    updateUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCometChatClient).mockReturnValue(mockClient as any);
  });

  describe('syncNewUser', () => {
    const user: DesklineUser = {
      id: 'uuid-123',
      name: 'John Doe',
      role: 'employee',
      department: 'IT',
    };

    it('creates a CometChat user with correct UID, name, and tags', async () => {
      mockClient.createUser.mockResolvedValue({ uid: 'uuid-123', name: 'John Doe' });
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await syncNewUser(user);

      expect(result.success).toBe(true);
      expect(result.uid).toBe('uuid-123');
      expect(mockClient.createUser).toHaveBeenCalledWith({
        uid: 'uuid-123',
        name: 'John Doe',
        tags: ['role:employee', 'dept:IT'],
      });
    });

    it('updates cometchatUid in database on success', async () => {
      mockClient.createUser.mockResolvedValue({ uid: 'uuid-123', name: 'John Doe' });
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await syncNewUser(user);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { cometchatUid: 'uuid-123' },
      });
    });

    it('retries up to 3 times on failure', async () => {
      mockClient.createUser
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Rate limited'));

      const result = await syncNewUser(user);

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(3);
      expect(mockClient.createUser).toHaveBeenCalledTimes(3);
    });

    it('succeeds on retry after initial failure', async () => {
      mockClient.createUser
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({ uid: 'uuid-123', name: 'John Doe' });
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await syncNewUser(user);

      expect(result.success).toBe(true);
      expect(mockClient.createUser).toHaveBeenCalledTimes(2);
    });

    it('leaves cometchatUid as null (pending) on final failure', async () => {
      mockClient.createUser.mockRejectedValue(new Error('Persistent failure'));

      const result = await syncNewUser(user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent failure');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('applies correct tags for different roles and departments', async () => {
      const adminUser: DesklineUser = {
        id: 'admin-1',
        name: 'Admin User',
        role: 'admin',
        department: 'HR',
      };
      mockClient.createUser.mockResolvedValue({ uid: 'admin-1' });
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await syncNewUser(adminUser);

      expect(mockClient.createUser).toHaveBeenCalledWith({
        uid: 'admin-1',
        name: 'Admin User',
        tags: ['role:admin', 'dept:HR'],
      });
    });
  });

  describe('batchSyncUsers', () => {
    it('processes users in batches of 25', async () => {
      const users: DesklineUser[] = Array.from({ length: 30 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        role: 'employee' as const,
        department: 'General' as const,
      }));

      mockClient.createUsers.mockResolvedValue([]);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await batchSyncUsers(users);

      expect(result.total).toBe(30);
      expect(result.successful).toBe(30);
      expect(result.failed).toBe(0);
    });

    it('falls back to individual sync when batch fails', async () => {
      const users: DesklineUser[] = [
        { id: 'user-a', name: 'User A', role: 'employee', department: 'IT' },
        { id: 'user-b', name: 'User B', role: 'agent', department: 'HR' },
      ];

      mockClient.createUsers.mockRejectedValue(new Error('Batch failed'));
      // Individual syncs succeed
      mockClient.createUser.mockResolvedValue({});
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const result = await batchSyncUsers(users);

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('updates cometchatUid for each user in successful batch', async () => {
      const users: DesklineUser[] = [
        { id: 'user-x', name: 'User X', role: 'employee', department: 'IT' },
        { id: 'user-y', name: 'User Y', role: 'agent', department: 'HR' },
      ];

      mockClient.createUsers.mockResolvedValue([]);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await batchSyncUsers(users);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-x' },
        data: { cometchatUid: 'user-x' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-y' },
        data: { cometchatUid: 'user-y' },
      });
    });
  });

  describe('updateUserTags', () => {
    it('calls setUserTags with the correct format', async () => {
      mockClient.setUserTags.mockResolvedValue(undefined);

      await updateUserTags('user-123', 'supervisor', 'General');

      expect(mockClient.setUserTags).toHaveBeenCalledWith('user-123', [
        'role:supervisor',
        'dept:General',
      ]);
    });

    it('throws when CometChat API fails', async () => {
      mockClient.setUserTags.mockRejectedValue(new Error('API error'));

      await expect(updateUserTags('user-123', 'employee', 'IT')).rejects.toThrow('API error');
    });
  });

  describe('retryPendingSync', () => {
    it('queries users with null cometchatUid', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await retryPendingSync();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { cometchatUid: null },
        select: { id: true, name: true, role: true, department: true },
      });
    });

    it('retries sync for each pending user', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'pending-1', name: 'Pending User', role: 'employee', department: 'IT' },
        { id: 'pending-2', name: 'Another Pending', role: 'agent', department: 'HR' },
      ] as any);
      mockClient.createUser.mockResolvedValue({});
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      await retryPendingSync();

      // Should attempt to create each pending user
      expect(mockClient.createUser).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no pending users', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      await retryPendingSync();

      expect(mockClient.createUser).not.toHaveBeenCalled();
    });
  });
});
