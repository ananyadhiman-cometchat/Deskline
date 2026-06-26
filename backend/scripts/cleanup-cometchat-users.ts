import './_load-env.js';
import { getCometChatClient } from '../src/modules/cometchat/cometchat-client.js';
import { env } from '../src/config/env.js';

/**
 * CometChat User Cleanup Script
 *
 * Lists every user in the CometChat app and permanently deletes them so the
 * app's user count is freed up. This is meant to clear orphaned users left
 * behind by older seeds that used random (non-deterministic) UIDs.
 *
 * SAFETY:
 *  - Runs in DRY-RUN mode by default (lists what would be deleted, deletes nothing).
 *  - Pass `--yes` to actually perform the permanent deletion.
 *  - The AI agent UID (COMETCHAT_AI_AGENT_UID) is always preserved.
 *  - Pass `--keep=uid1,uid2` to preserve additional UIDs.
 *
 * Usage:
 *   tsx scripts/cleanup-cometchat-users.ts            # dry run
 *   tsx scripts/cleanup-cometchat-users.ts --yes      # permanently delete
 *   tsx scripts/cleanup-cometchat-users.ts --yes --keep=admin-1,agent-2
 */

const args = process.argv.slice(2);
const CONFIRM = args.includes('--yes');
const keepArg = args.find((a) => a.startsWith('--keep='));
const extraKeep = keepArg ? keepArg.replace('--keep=', '').split(',').map((s) => s.trim()).filter(Boolean) : [];

function buildKeepSet(): Set<string> {
  const keep = new Set<string>(extraKeep);
  if (env.COMETCHAT_AI_AGENT_UID) keep.add(env.COMETCHAT_AI_AGENT_UID);
  return keep;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const client = getCometChatClient();
  const keep = buildKeepSet();

  console.log('[Cleanup] Listing all CometChat users...');

  const allUids: string[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { users, pagination } = await client.listUsers({ page, perPage: 100 });
    for (const u of users) allUids.push(u.uid);
    totalPages = pagination.totalPages;
    console.log(`[Cleanup] Page ${page}/${totalPages} — collected ${allUids.length} so far (total reported: ${pagination.total}).`);
    page += 1;
  } while (page <= totalPages);

  const toDelete = allUids.filter((uid) => !keep.has(uid));

  console.log('');
  console.log(`[Cleanup] Total users found : ${allUids.length}`);
  console.log(`[Cleanup] Preserved (keep)  : ${[...keep].join(', ') || '(none)'}`);
  console.log(`[Cleanup] To delete         : ${toDelete.length}`);
  console.log('');

  if (!CONFIRM) {
    console.log('[Cleanup] DRY RUN — no users were deleted.');
    console.log('[Cleanup] Re-run with --yes to permanently delete the users listed above.');
    return;
  }

  console.log('[Cleanup] Permanently deleting users...');
  let deleted = 0;
  let failed = 0;

  for (const uid of toDelete) {
    try {
      await client.deleteUser(uid, true);
      deleted += 1;
      if (deleted % 25 === 0) {
        console.log(`[Cleanup] Deleted ${deleted}/${toDelete.length}...`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[Cleanup] Failed to delete ${uid}:`, error instanceof Error ? error.message : error);
    }
    // Light throttle to stay under CometChat REST rate limits.
    await sleep(60);
  }

  console.log('');
  console.log(`[Cleanup] Done. Deleted: ${deleted}, Failed: ${failed}, Preserved: ${keep.size}.`);
}

main().catch((error) => {
  console.error('[Cleanup] Fatal error:', error);
  process.exit(1);
});
