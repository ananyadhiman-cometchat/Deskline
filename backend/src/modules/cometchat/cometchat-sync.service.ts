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
        role: user.role,
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
        // If user already exists in CometChat (stable UID re-sync), update the
        // existing record so role/tags/name stay in sync, then treat as success.
        if (error.statusCode === 409) {
          try {
            const client = getCometChatClient();
            await client.updateUser(user.id, {
              name: user.name,
              role: user.role,
              tags: [`role:${user.role}`, `dept:${user.department}`],
            });
          } catch {
            // Non-fatal: the user exists, which is what matters for token gen.
          }
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
 * Fetch the set of all existing CometChat user UIDs (paginated).
 * Returns an empty set if listing fails, so callers can degrade gracefully.
 */
async function fetchExistingCometChatUids(): Promise<Set<string>> {
  const client = getCometChatClient();
  const uids = new Set<string>();
  let page = 1;
  let totalPages = 1;

  do {
    const { users, pagination } = await client.listUsers({ page, perPage: 100 });
    for (const u of users) uids.add(u.uid);
    totalPages = pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return uids;
}

/**
 * Batch-sync multiple DeskLine users to CometChat.
 *
 * Checks which users already exist in CometChat first, then updates the
 * existing ones (role/tags/name) and only creates the missing ones. This
 * prevents duplicate creation and avoids exhausting the app's user limit on
 * re-seeds. If the existence check fails (e.g. CometChat unreachable), falls
 * back to per-user sync which still handles the 409 "already exists" case.
 *
 * @param users - Array of DeskLine users to sync
 * @returns BatchSyncResult with totals and individual results
 */
export async function batchSyncUsers(users: DesklineUserForSync[]): Promise<BatchSyncResult> {
  const results: SyncResult[] = [];
  let successful = 0;
  let failed = 0;

  let existingUids: Set<string> | null = null;
  try {
    existingUids = await fetchExistingCometChatUids();
    console.log(`[CometChat Sync] Found ${existingUids.size} existing users in CometChat.`);
  } catch (error) {
    console.warn(
      '[CometChat Sync] Could not list existing users; falling back to per-user create/409 handling.',
      error instanceof Error ? error.message : error
    );
  }

  for (const user of users) {
    let result: SyncResult;

    if (existingUids && existingUids.has(user.id)) {
      // Already exists — update in place instead of creating a duplicate.
      result = await updateExistingUser(user);
    } else {
      result = await syncNewUser(user);
    }

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
 * Update an existing CometChat user's name/role/tags and ensure the
 * cometchatUid is recorded in the database.
 */
async function updateExistingUser(user: DesklineUserForSync): Promise<SyncResult> {
  try {
    const client = getCometChatClient();
    await client.updateUser(user.id, {
      name: user.name,
      role: user.role,
      tags: [`role:${user.role}`, `dept:${user.department}`],
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { cometchatUid: user.id },
    });
    return { success: true, uid: user.id };
  } catch (error) {
    const message =
      error instanceof CometChatApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
    return { success: false, uid: user.id, error: message };
  }
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
