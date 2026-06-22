/**
 * CometChat error formatting and logging utilities.
 *
 * CometChatException objects have `code`/`errorCode` and `message`/`errorDescription`
 * fields depending on the kit version. Calling `String(e)` on them yields "[object Object]".
 * These helpers extract meaningful information and provide doc hints for known error codes.
 */

/**
 * Format a CometChat error into a human-readable string.
 * Handles CometChatException objects (which have code/errorCode and message/errorDescription),
 * plain Error instances, and unknown values. Never returns "[object Object]".
 */
export function formatCometChatError(e: unknown): string {
  if (e == null) return "Unknown CometChat error.";

  const err = e as Record<string, unknown>;
  const code =
    (err.code as string | undefined) ??
    (err.errorCode as string | undefined);
  const message =
    (err.message as string | undefined) ??
    (err.errorDescription as string | undefined);

  if (code && message) return `[CometChat ${code}] ${message}`;
  if (message) return `[CometChat] ${message}`;

  try {
    return `[CometChat] ${JSON.stringify(e)}`;
  } catch {
    return `[CometChat] ${String(e)}`;
  }
}

/**
 * Known error codes mapped to actionable documentation hints.
 * These help developers quickly resolve common CometChat integration issues.
 */
const KNOWN_DOC_HINTS: Record<string, string> = {
  ERROR_API_KEY_NOT_FOUND:
    "Auth Key is missing or invalid. Check your env vars (VITE_COMETCHAT_AUTH_KEY) and confirm the key in Dashboard → App → Credentials.",
  ERR_UID_NOT_FOUND:
    "The UID you're logging in with doesn't exist in this CometChat app. Create the user in Dashboard → Users, or use the backend user sync service.",
  ERR_AUTH_TOKEN_NOT_FOUND:
    "Auth token is empty or expired. Re-mint it from your backend via the CometChat REST API (/api/cometchat/auth-token).",
  AUTH_ERR_BOT:
    "This UID is flagged as a Bot in the dashboard — auth-key login is refused for bot users by design. Toggle Bot OFF in Dashboard → Users, or use a non-bot UID.",
};

/**
 * Log a formatted CometChat error to the console, including doc hints for known error codes.
 * Use this in catch blocks alongside `formatCometChatError` for UI display.
 */
export function logCometChatError(e: unknown): void {
  const formatted = formatCometChatError(e);
  console.error(formatted, e);

  const code =
    (e as { code?: string; errorCode?: string })?.code ??
    (e as { code?: string; errorCode?: string })?.errorCode;

  if (code && KNOWN_DOC_HINTS[code]) {
    console.warn(`[CometChat hint] ${KNOWN_DOC_HINTS[code]}`);
  }
}
