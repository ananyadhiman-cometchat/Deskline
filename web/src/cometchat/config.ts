/**
 * CometChat environment configuration.
 *
 * Reads App ID and Region from Vite environment variables (VITE_ prefix).
 * The Auth Key is intentionally excluded from client-side code —
 * auth tokens are generated server-side and delivered via the backend API.
 */

export const COMETCHAT_APP_ID: string =
  import.meta.env.VITE_COMETCHAT_APP_ID ?? "";

export const COMETCHAT_REGION: string =
  import.meta.env.VITE_COMETCHAT_REGION ?? "us";
