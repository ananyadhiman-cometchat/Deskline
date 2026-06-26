import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Side-effect module: loads environment variables for standalone scripts.
 *
 * CometChat credentials live in the project-root .env (Deskline/.env), while
 * DB/JWT vars live in backend/.env. Import this FIRST (before any module that
 * reads env, e.g. config/env.ts) so process.env is populated in time.
 *
 * dotenv does not override already-set vars, so loading order is non-destructive.
 */
const here = dirname(fileURLToPath(import.meta.url));

// backend/.env (DB, JWT, etc.)
config({ path: resolve(here, '../.env') });
// project-root .env (CometChat server-side credentials)
config({ path: resolve(here, '../../.env') });
