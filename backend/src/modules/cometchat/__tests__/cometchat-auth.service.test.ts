import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

// Mock the sync service
vi.mock('../cometchat-sync.service.js', () => ({
  syncNewUser: vi.fn(),
}));

import { prisma } from '../../../lib/prisma.js';
import { getCometChatClient, CometChatApiError } from '../cometchat-client.js';
import { syncNewUser } from '../cometchat-sync.service.js';
import { generateToken, ensureUserAndGenerateToken } from '../cometchat-auth.service.js';

describe('cometchat-auth.service', () => {
  const mockClient = {
    createAuthToken: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCometChatClient).mockReturnValue(mockClient as any);
  });

  describe('generateToken', () => {
    it('generates a token using the cometchatUid when set', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        cometchatUid: 'user-123',
      } as any);
      mockClient.createAuthToken.mockResolvedValue({ authToken: 'token-abc' });

      const token = await generateToken('user-123');

      expect(token).toBe('token-abc');
      expect(mockClient.createAuthToken).toHaveBeenCalledWith('user-123');
    });

    it('uses the user id as uid when cometchatUid is null', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-456',
        cometchatUid: null,
      } as any);
      mockClient.createAuthToken.mockResolvedValue({ authToken: 'token-def' });

      const token = await generateToken('user-456');

      expect(token).toBe('token-def');
      expect(mockClient.createAuthToken).toHaveBeenCalledWith('user-456');
    });

    it('throws 404 when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(generateToken('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('throws 503 when CometChat API fails', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-789',
        cometchatUid: 'user-789',
      } as any);
      mockClient.createAuthToken.mockRejectedValue(
        new CometChatApiError('Service unavailable', '/users/user-789/auth_tokens', 500)
      );

      await expect(generateToken('user-789')).rejects.toMatchObject({
        statusCode: 503,
        code: 'COMETCHAT_TOKEN_GENERATION_FAILED',
      });
    });

    it('throws 503 on unexpected errors', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-999',
        cometchatUid: 'user-999',
      } as any);
      mockClient.createAuthToken.mockRejectedValue(new Error('Network timeout'));

      await expect(generateToken('user-999')).rejects.toMatchObject({
        statusCode: 503,
        code: 'COMETCHAT_TOKEN_GENERATION_FAILED',
      });
    });

    it('never exposes Auth Key, REST API Key, or App Secret in error messages', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-111',
        cometchatUid: 'user-111',
      } as any);
      mockClient.createAuthToken.mockRejectedValue(
        new CometChatApiError('Invalid API key', '/users/user-111/auth_tokens', 401)
      );

      try {
        await generateToken('user-111');
      } catch (error: any) {
        // The error message should describe the failure but not include actual secrets
        expect(error.message).not.toContain('COMETCHAT_REST_API_KEY');
        expect(error.message).not.toContain('COMETCHAT_APP_ID');
        expect(error.message).toContain('CometChat auth token generation failed');
      }
    });
  });

  describe('ensureUserAndGenerateToken', () => {
    it('generates token directly when user already has cometchatUid', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-200',
        name: 'John',
        cometchatUid: 'user-200',
        role: 'employee',
        department: 'IT',
      } as any);
      mockClient.createAuthToken.mockResolvedValue({ authToken: 'token-existing' });

      const token = await ensureUserAndGenerateToken('user-200');

      expect(token).toBe('token-existing');
      expect(syncNewUser).not.toHaveBeenCalled();
    });

    it('syncs user before generating token when cometchatUid is null', async () => {
      // First call for ensureUserAndGenerateToken - user without cometchatUid
      // Second call (inside generateToken) - user now has cometchatUid after sync
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'user-300',
          name: 'Jane',
          cometchatUid: null,
          role: 'agent',
          department: 'HR',
        } as any)
        .mockResolvedValueOnce({
          id: 'user-300',
          cometchatUid: 'user-300',
        } as any);

      vi.mocked(syncNewUser).mockResolvedValue({ success: true, uid: 'user-300' });
      mockClient.createAuthToken.mockResolvedValue({ authToken: 'token-after-sync' });

      const token = await ensureUserAndGenerateToken('user-300');

      expect(token).toBe('token-after-sync');
      expect(syncNewUser).toHaveBeenCalledWith({
        id: 'user-300',
        name: 'Jane',
        role: 'agent',
        department: 'HR',
      });
    });

    it('throws 503 when sync fails', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-400',
        name: 'Bob',
        cometchatUid: null,
        role: 'employee',
        department: 'General',
      } as any);
      vi.mocked(syncNewUser).mockResolvedValue({
        success: false,
        uid: 'user-400',
        error: 'CometChat API rate limited',
      });

      await expect(ensureUserAndGenerateToken('user-400')).rejects.toMatchObject({
        statusCode: 503,
        code: 'COMETCHAT_USER_SYNC_FAILED',
      });
    });

    it('throws 404 when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(ensureUserAndGenerateToken('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    });

    it('throws 503 when sync throws an unexpected error', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-500',
        name: 'Alice',
        cometchatUid: null,
        role: 'supervisor',
        department: 'IT',
      } as any);
      vi.mocked(syncNewUser).mockRejectedValue(new Error('Network failure'));

      await expect(ensureUserAndGenerateToken('user-500')).rejects.toMatchObject({
        statusCode: 503,
        code: 'COMETCHAT_USER_SYNC_FAILED',
      });
    });
  });
});
