import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// Mock the auth service
vi.mock('../cometchat-auth.service.js', () => ({
  ensureUserAndGenerateToken: vi.fn(),
}));

import { ensureUserAndGenerateToken } from '../cometchat-auth.service.js';
import { getAuthTokenController } from '../cometchat.controller.js';

describe('cometchat.controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe('getAuthTokenController', () => {
    it('returns cometchatAuthToken for authenticated user', async () => {
      mockReq = { user: { id: 'user-123', role: 'employee', department: 'IT' } } as any;
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('fresh-token-abc');

      await getAuthTokenController(mockReq as Request, mockRes as Response);

      expect(ensureUserAndGenerateToken).toHaveBeenCalledWith('user-123');
      expect(mockRes.json).toHaveBeenCalledWith({ cometchatAuthToken: 'fresh-token-abc' });
    });

    it('works for any role (agent)', async () => {
      mockReq = { user: { id: 'agent-456', role: 'agent', department: 'HR' } } as any;
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('agent-token');

      await getAuthTokenController(mockReq as Request, mockRes as Response);

      expect(ensureUserAndGenerateToken).toHaveBeenCalledWith('agent-456');
      expect(mockRes.json).toHaveBeenCalledWith({ cometchatAuthToken: 'agent-token' });
    });

    it('works for any role (admin)', async () => {
      mockReq = { user: { id: 'admin-789', role: 'admin', department: 'IT' } } as any;
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('admin-token');

      await getAuthTokenController(mockReq as Request, mockRes as Response);

      expect(ensureUserAndGenerateToken).toHaveBeenCalledWith('admin-789');
      expect(mockRes.json).toHaveBeenCalledWith({ cometchatAuthToken: 'admin-token' });
    });

    it('throws 401 when user is not authenticated', async () => {
      mockReq = { user: undefined } as any;

      await expect(
        getAuthTokenController(mockReq as Request, mockRes as Response)
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_REQUIRED',
      });
    });

    it('throws 401 when user is null', async () => {
      mockReq = { user: null } as any;

      await expect(
        getAuthTokenController(mockReq as Request, mockRes as Response)
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'AUTH_REQUIRED',
      });
    });

    it('propagates service errors (503 on CometChat failure)', async () => {
      mockReq = { user: { id: 'user-500', role: 'employee', department: 'IT' } } as any;
      const serviceError = Object.assign(new Error('CometChat auth token generation failed'), {
        statusCode: 503,
        code: 'COMETCHAT_TOKEN_GENERATION_FAILED',
      });
      vi.mocked(ensureUserAndGenerateToken).mockRejectedValue(serviceError);

      await expect(
        getAuthTokenController(mockReq as Request, mockRes as Response)
      ).rejects.toMatchObject({
        statusCode: 503,
        code: 'COMETCHAT_TOKEN_GENERATION_FAILED',
      });
    });

    it('serves as token refresh: generates new token on each call', async () => {
      mockReq = { user: { id: 'user-refresh', role: 'employee', department: 'General' } } as any;
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('refreshed-token-xyz');

      await getAuthTokenController(mockReq as Request, mockRes as Response);

      // The endpoint always generates a fresh token, serving as the refresh mechanism
      expect(ensureUserAndGenerateToken).toHaveBeenCalledWith('user-refresh');
      expect(mockRes.json).toHaveBeenCalledWith({ cometchatAuthToken: 'refreshed-token-xyz' });
    });

    it('response does not contain any CometChat secrets', async () => {
      mockReq = { user: { id: 'user-secure', role: 'employee', department: 'IT' } } as any;
      vi.mocked(ensureUserAndGenerateToken).mockResolvedValue('safe-token');

      await getAuthTokenController(mockReq as Request, mockRes as Response);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const responseBody = vi.mocked(mockRes.json!).mock.calls[0]![0] as Record<string, unknown>;
      const responseStr = JSON.stringify(responseBody);

      // Ensure no sensitive keys are in the response
      expect(responseStr).not.toContain('REST_API_KEY');
      expect(responseStr).not.toContain('AUTH_KEY');
      expect(responseStr).not.toContain('APP_SECRET');
      // Only the token should be present
      expect(Object.keys(responseBody)).toEqual(['cometchatAuthToken']);
    });
  });
});
