import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { getCometChatClient, CometChatApiError } from './cometchat-client.js';
import { syncNewUser } from './cometchat-sync.service.js';

/**
 * CometChat Auth Token Service
 *
 * Generates CometChat auth tokens server-side using the REST API.
 * The Auth Key, REST API Key, and App Secret are never included in any response.
 */

/**
 * Generate a CometChat auth token for the given DeskLine user.
 *
 * Looks up the user's cometchatUid (which equals their DeskLine UUID)
 * and calls the CometChat REST API to create an auth token.
 *
 * @param userId - The DeskLine user UUID
 * @returns The CometChat auth token string
 * @throws AppError with 503 if token generation fails
 * @throws AppError with 404 if user not found
 */
export async function generateToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, cometchatUid: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const uid = user.cometchatUid ?? user.id;

  try {
    const client = getCometChatClient();
    const { authToken } = await client.createAuthToken(uid);
    return authToken;
  } catch (error) {
    if (error instanceof CometChatApiError) {
      throw new AppError(
        `CometChat auth token generation failed: ${error.message}`,
        503,
        'COMETCHAT_TOKEN_GENERATION_FAILED'
      );
    }
    throw new AppError(
      'CometChat auth token generation failed due to an unexpected error',
      503,
      'COMETCHAT_TOKEN_GENERATION_FAILED'
    );
  }
}

/**
 * Ensure the user exists in CometChat and generate an auth token.
 *
 * If the user does not have a `cometchatUid` set in the database,
 * triggers a sync to create the user in CometChat first, then
 * generates the auth token.
 *
 * @param userId - The DeskLine user UUID
 * @returns The CometChat auth token string
 * @throws AppError with 503 if token generation fails
 * @throws AppError with 404 if user not found
 */
export async function ensureUserAndGenerateToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, cometchatUid: true, role: true, department: true },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // If user doesn't have a cometchatUid, sync them to CometChat first
  if (!user.cometchatUid) {
    try {
      const syncResult = await syncNewUser({
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
      });

      if (!syncResult.success) {
        throw new AppError(
          `Failed to sync user to CometChat: ${syncResult.error ?? 'unknown error'}`,
          503,
          'COMETCHAT_USER_SYNC_FAILED'
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Failed to sync user to CometChat before token generation',
        503,
        'COMETCHAT_USER_SYNC_FAILED'
      );
    }
  }

  return generateToken(userId);
}
