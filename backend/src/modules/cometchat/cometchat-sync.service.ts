import { prisma } from '../../lib/prisma.js';
import { getCometChatClient, CometChatApiError } from './cometchat-client.js';
import type { SyncResult, BatchSyncResult } from './cometchat.types.js';
import type { UserRole, Department } from '@prisma/client';

/**
 * CometChat User Sync Service
 *
 * Handles creating and updating users in CometChat to mirror DeskLine users.
 * Tags users with role and department for RBAC filtering.
 *
 * Full implementation in task 2.2. This file provides the interface consumed
 * by the auth service (ensureUserAndGenerateToken).
 */

export interface DesklineUserForSync {
  id: string;
  name: string;
  role: UserRole;
  department: Department;
}

/**
 * Sync a single DeskLine user to CometChat.
 *
 * Creates the CometChat user with:
 * - UID = DeskLine UUID
 * - name = display name
 * - tags = ["role:{role}", "dept:{department}"]
 *
 * Retries up to 3 times on failure. On success, updates the user's
 * cometchatUid field in the database.
 *
 * @param user - The DeskLine user to sync
 * @returns SyncResult indicating success or failure
 */
export async function syncNewUser(user: DesklineUserForSync): Promise<SyncResult> {
  const maxRetries = 3;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = getCometChatClient();
      const tags = [`role:${user.role}`, `dept:${user.department}`];

      await client.createUser({
        uid: user.id,
        name: user.name,
        tags,
      });

      // Update the user's cometchatUid in the database
      await prisma.user.update({
        where: { id: user.id },
        data: { cometchatUid: user.id },
      });

      return { success: true, uid: user.id };
    } catch (error) {
      if (error instanceof CometChatApiError) {
        lastError = error.message;
        // If user already exists in CometChat, treat as success
        if (error.statusCode === 409) {
          await prisma.user.update({
            where: { id: user.id },
            data: { cometchatUid: user.id },
          });
          return { success: true, uid: user.id };
        }
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  return {
    success: false,
    uid: user.id,
    error: lastError ?? 'Max retries exceeded',
    retryCount: maxRetries,
  };
}

/**
 * Batch-sync multiple DeskLine users to CometChat.
 * Uses the bulk user creation API for efficiency.
 *
 * @param users - Array of DeskLine users to sync
 * @returns BatchSyncResult with totals and individual results
 */
export async function batchSyncUsers(users: DesklineUserForSync[]): Promise<BatchSyncResult> {
  // Placeholder — full implementation in task 2.2
  const results: SyncResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const user of users) {
    const result = await syncNewUser(user);
    results.push(result);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { total: users.length, successful, failed, results };
}

/**
 * Update CometChat user tags when role or department changes.
 *
 * @param userId - The DeskLine user UUID
 * @param role - The new role
 * @param department - The new department
 */
export async function updateUserTags(
  userId: string,
  role: UserRole,
  department: Department
): Promise<void> {
  const client = getCometChatClient();
  const tags = [`role:${role}`, `dept:${department}`];
  await client.setUserTags(userId, tags);
}

/**
 * Retry sync for users with pending cometchat_uid (null).
 * Queries all users without a cometchatUid and attempts to sync them.
 */
export async function retryPendingSync(): Promise<void> {
  const pendingUsers = await prisma.user.findMany({
    where: { cometchatUid: null },
    select: { id: true, name: true, role: true, department: true },
  });

  for (const user of pendingUsers) {
    await syncNewUser(user);
  }
}
