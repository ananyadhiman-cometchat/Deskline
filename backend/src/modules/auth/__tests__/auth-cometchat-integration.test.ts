import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
  },
}));

// Mock password utilities
vi.mock('../../../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn(),
}));

// Mock token utilities
vi.mock('../../../lib/token.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('access-token-xyz'),
  createRefreshToken: vi.fn().mockReturnValue('refresh-token-xyz'),
  hashToken: vi.fn().mockReturnValue('hashed-refresh-token'),
  parseDurationToMs: vi.fn().mockReturnValue(86400000),
}));

// Mock activity log
vi.mock('../../activity-logs/activity-logs.service.js', () => ({
  recordActivityLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock cometchat services
vi.mock('../../cometchat/cometchat-auth.service.js', () => ({
  ensureUserAndGenerateToken: vi.fn(),
}));

vi.mock('../../cometchat/cometchat-sync.service.js', () => ({
  syncNewUser: vi.fn().mockResolvedValue({ success: true, uid: 'user-id' }),
}));

import { prisma } from '../../../lib/prisma.js';
import { comparePassword } from '../../../lib/password.js';
import { ensureUserAndGenerateToken } from '../../cometchat/cometchat-auth.service.js';
import { loginUser, registerUser } from '../auth.service.js';

describe('auth-cometchat integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(),
      revokedAt: null,
      replacedById: null,
      createdAt: new Date(),
    } as any);
  });

  describe('loginUser includes cometchatAuthToken', () => {
    it('returns cometchatAuthToken on successful login', async () => {
      const mockUser = {
        id: 'user-login-1',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed',
        role: 'employee',
        department: 'IT',
        isActive: true,
        lastLoginAt: null,
        lastFailedLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('cometchat-token-login');

      const result = await loginUser({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('cometchatAuthToken', 'cometchat-token-login');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('returns null cometchatAuthToken when CometChat is unavailable (graceful degradation)', async () => {
      const mockUser = {
        id: 'user-login-2',
        name: 'Test User 2',
        email: 'test2@example.com',
        passwordHash: 'hashed',
        role: 'agent',
        department: 'HR',
        isActive: true,
        lastLoginAt: null,
        lastFailedLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserAndGenerateToken).mockRejectedValue(new Error('CometChat down'));

      const result = await loginUser({ email: 'test2@example.com', password: 'password123' });

      // Login succeeds even if CometChat fails
      expect(result).toHaveProperty('cometchatAuthToken', null);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('login response does not expose CometChat secrets', async () => {
      const mockUser = {
        id: 'user-login-3',
        name: 'Test User 3',
        email: 'test3@example.com',
        passwordHash: 'hashed',
        role: 'employee',
        department: 'General',
        isActive: true,
        lastLoginAt: null,
        lastFailedLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('safe-token');

      const result = await loginUser({ email: 'test3@example.com', password: 'password123' });

      const resultStr = JSON.stringify(result);
      expect(resultStr).not.toContain('REST_API_KEY');
      expect(resultStr).not.toContain('AUTH_KEY');
      expect(resultStr).not.toContain('APP_SECRET');
      expect(resultStr).not.toContain('COMETCHAT_REST_API_KEY');
    });
  });

  describe('registerUser includes cometchatAuthToken', () => {
    it('returns cometchatAuthToken on successful registration', async () => {
      const mockCreatedUser = {
        id: 'user-reg-1',
        name: 'New User',
        email: 'new@example.com',
        role: 'employee',
        department: 'IT',
        isActive: true,
        lastLoginAt: null,
        lastFailedLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // No existing user
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('cometchat-token-register');

      const result = await registerUser({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        department: 'IT' as any,
      });

      expect(result).toHaveProperty('cometchatAuthToken', 'cometchat-token-register');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('returns null cometchatAuthToken when CometChat is unavailable during registration', async () => {
      const mockCreatedUser = {
        id: 'user-reg-2',
        name: 'New User 2',
        email: 'new2@example.com',
        role: 'employee',
        department: 'HR',
        isActive: true,
        lastLoginAt: null,
        lastFailedLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
      vi.mocked(ensureUserAndGenerateToken).mockRejectedValue(new Error('Network error'));

      const result = await registerUser({
        name: 'New User 2',
        email: 'new2@example.com',
        password: 'password123',
        department: 'HR' as any,
      });

      // Registration succeeds even if CometChat fails
      expect(result).toHaveProperty('cometchatAuthToken', null);
      expect(result).toHaveProperty('user');
    });
  });
});
