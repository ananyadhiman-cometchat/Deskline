import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";
import { CometChatCalls } from "@cometchat/calls-sdk-javascript";
import { COMETCHAT_APP_ID, COMETCHAT_REGION } from "./config";
import { formatCometChatError, logCometChatError } from "./errors";
import { registerCometChatPushToken } from "./pushNotifications";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

// ============================================================
// CometChatProvider — Init + Login + Calls SDK gate
// ============================================================
// Module-level guards prevent double-init under React 18 StrictMode.
// StrictMode triggers effects twice (mount → unmount → mount) in dev,
// which would otherwise cause "SDK already initialized" or
// "Please wait until the previous login request ends" errors.

let initialized = false;
let loginInFlight: Promise<unknown> | null = null;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface CometChatContextValue {
  isReady: boolean;
  error: string | null;
}

const CometChatContext = createContext<CometChatContextValue>({
  isReady: false,
  error: null,
});

/**
 * Hook for child components to check CometChat ready state.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useCometChat = () => useContext(CometChatContext);

/**
 * Wait for a given number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initialize the CometChat UI Kit SDK with exponential backoff retry.
 * Retries up to MAX_RETRIES times on failure (1s, 2s, 4s delays).
 */
async function initWithRetry(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const settings = new UIKitSettingsBuilder()
        .setAppId(COMETCHAT_APP_ID)
        .setRegion(COMETCHAT_REGION)
        .subscribePresenceForAllUsers()
        .build();

      await CometChatUIKit.init(settings);
      return; // success
    } catch (e) {
      lastError = e;
      logCometChatError(e);
      if (attempt < MAX_RETRIES - 1) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt)); // 1s, 2s, 4s
      }
    }
  }

  throw lastError;
}

/**
 * Initialize CometChat Calls SDK v5 with exponential backoff retry.
 */
async function initCallsWithRetry(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await CometChatCalls.init({
        appId: COMETCHAT_APP_ID,
        region: COMETCHAT_REGION as "us" | "eu" | "in",
      });
      if (result && (result as { error?: unknown }).error) {
        throw (result as { error: unknown }).error;
      }
      return; // success
    } catch (e) {
      lastError = e;
      logCometChatError(e);
      if (attempt < MAX_RETRIES - 1) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Guard concurrent login calls. React StrictMode double-mounts cause
 * two login() calls to overlap — the SDK rejects concurrent logins.
 * This caches the in-flight promise so the second caller just awaits it.
 *
 * `expectedUid` is the DeskLine user id of the account that just logged in
 * (CometChat UIDs === DeskLine user ids). Because this is a single-page app,
 * the CometChat SDK session survives DeskLine logout/login. If we don't verify
 * identity here, a previous user's stale session (e.g. "employee 1") short-
 * circuits the early-return and the new user (agent/admin) is never logged in —
 * so the app keeps showing the previous user's chats and calls.
 */
async function ensureLoggedIn(
  authToken: string,
  expectedUid: string
): Promise<void> {
  const existing = await CometChatUIKit.getLoggedinUser();

  // Already logged in as the correct user — nothing to do.
  if (existing && existing.getUid() === expectedUid) return;

  // A different user's session is still active (SPA logout/login, or a
  // swallowed logout error). Tear it down before logging in the new user.
  if (existing && existing.getUid() !== expectedUid) {
    await CometChatUIKit.logout().catch(() => {});
    loginInFlight = null;
  }

  if (loginInFlight) {
    await loginInFlight;
    // The in-flight login may have been for the previous user; re-verify.
    const after = await CometChatUIKit.getLoggedinUser();
    if (after && after.getUid() === expectedUid) return;
  }

  loginInFlight = CometChatUIKit.loginWithAuthToken(authToken);
  try {
    await loginInFlight;
  } finally {
    loginInFlight = null;
  }
}

/**
 * Fetch a CometChat auth token from the DeskLine backend.
 */
async function fetchAuthToken(): Promise<string> {
  const { data } = await api.post<{ cometchatAuthToken?: string }>(
    "/api/cometchat/auth-token"
  );
  // Backend returns { cometchatAuthToken: token }. Also handle a wrapped
  // { data: { cometchatAuthToken } } shape and legacy { authToken } just in case.
  const payload = data as unknown as {
    data?: { cometchatAuthToken?: string; authToken?: string };
    cometchatAuthToken?: string;
    authToken?: string;
  };
  const token =
    payload.cometchatAuthToken ??
    payload.authToken ??
    payload.data?.cometchatAuthToken ??
    payload.data?.authToken;
  if (!token) {
    throw new Error("Backend returned empty CometChat auth token");
  }
  return token;
}

interface CometChatProviderProps {
  children: ReactNode;
}

/**
 * CometChatProvider gates its children behind full SDK initialization:
 * 1. CometChatUIKit.init() — Chat SDK
 * 2. loginWithAuthToken — authenticate with server-minted token
 * 3. CometChatCalls.init() — Calls SDK v5
 *
 * On failure after 3 retries, displays a non-blocking toast and renders
 * an inline error state (non-chat features remain accessible).
 */
export function CometChatProvider({ children }: CometChatProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // CometChat UID === DeskLine user id. Drive (re)login off the current user
  // so switching accounts re-authenticates instead of reusing a stale session.
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    let cancelled = false;

    // No authenticated DeskLine user yet — don't attempt a CometChat login.
    if (!currentUserId) {
      setIsReady(false);
      return;
    }

    // Account (re)switch: close the children gate until the new user's
    // CometChat session is fully established, so no stale data is shown.
    setIsReady(false);
    setError(null);

    async function setup() {
      try {
        // 1. Init Chat SDK (with retry + exponential backoff)
        if (!initialized) {
          initialized = true;
          await initWithRetry();
        }

        // 2. Fetch auth token from backend and login as the current user
        const authToken = await fetchAuthToken();
        await ensureLoggedIn(authToken, currentUserId!);

        // 3. Init Calls SDK v5 (with retry + exponential backoff)
        await initCallsWithRetry();

        // 3.1 Login to Calls SDK — required for group call "Join" to work.
        // CometChatCalls.generateToken (called by the UI Kit when user taps
        // "Join" on a meeting card) requires an authenticated Calls SDK session.
        // Without this, it throws CometChatException with no details.
        try {
          const { CometChat } = await import("@cometchat/chat-sdk-javascript");
          const loggedInUser = await CometChat.getLoggedinUser();
          if (loggedInUser) {
            const userAuthToken = loggedInUser.getAuthToken();
            if (userAuthToken) {
              await CometChatCalls.loginWithAuthToken(userAuthToken);
            }
          }
        } catch (callsLoginErr) {
          // Non-fatal: 1:1 ringing still works via the Chat SDK's signaling,
          // but group call "Join" buttons won't function without this.
          console.warn("[CometChat] Calls SDK login failed (group calls may not work):", callsLoginErr);
        }

        // 4. Register FCM token with CometChat for web push notifications.
        // Runs in the background — does not block readiness.
        registerCometChatPushToken();

        // 5. Add global message listener for in-app toast notifications
        // when messages arrive in conversations the user isn't viewing.
        const { CometChat } = await import("@cometchat/chat-sdk-javascript");
        CometChat.addMessageListener(
          "GLOBAL_MESSAGE_TOAST_LISTENER",
          new CometChat.MessageListener({
            onTextMessageReceived: (message: CometChat.TextMessage) => {
              // Only show toast if user is NOT on the ticket page for this conversation
              const currentPath = window.location.pathname;
              const senderName = message.getSender()?.getName() ?? "Someone";
              const text = message.getText();
              const receiverId = message.getReceiverId();

              // Don't toast if user is viewing this specific ticket conversation
              if (currentPath.includes(receiverId)) return;

              // Extract ticket info from the group ID (format: "ticket-{ticketId}")
              const ticketId = receiverId.startsWith("ticket-")
                ? receiverId.replace("ticket-", "").slice(0, 8).toUpperCase()
                : null;
              const ticketLabel = ticketId ? ` • Ticket ${ticketId}` : "";

              useUIStore.getState().showToast({
                type: "info",
                title: `💬 ${senderName}${ticketLabel}`,
                message: text.length > 80 ? text.slice(0, 80) + "…" : text,
              });
            },
            onCustomMessageReceived: (message: CometChat.CustomMessage) => {
              // Show toast for meeting/call notifications
              if (message.getType() === "meeting") {
                const senderName = message.getSender()?.getName() ?? "Someone";
                const receiverId = message.getReceiverId();
                const currentPath = window.location.pathname;
                if (currentPath.includes(receiverId)) return;

                const ticketId = receiverId.startsWith("ticket-")
                  ? receiverId.replace("ticket-", "").slice(0, 8).toUpperCase()
                  : null;
                const ticketLabel = ticketId ? ` • Ticket ${ticketId}` : "";

                useUIStore.getState().showToast({
                  type: "info",
                  title: `📞 ${senderName}${ticketLabel}`,
                  message: "Started a call — tap Join in the conversation",
                });
              }
            },
          })
        );

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (e) {
        logCometChatError(e);
        const formatted = formatCometChatError(e);

        if (!cancelled) {
          setError(formatted);

          // Non-blocking toast so user can still use non-chat features
          useUIStore.getState().showToast({
            type: "error",
            title: "Chat Unavailable",
            message: formatted,
          });
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      // Clean up the global message listener
      import("@cometchat/chat-sdk-javascript").then(({ CometChat }) => {
        CometChat.removeMessageListener("GLOBAL_MESSAGE_TOAST_LISTENER");
      }).catch(() => {});
    };
  }, [currentUserId]);

  if (error) {
    return (
      <CometChatContext.Provider value={{ isReady: false, error }}>
        <div
          role="alert"
          style={{
            color: "#b91c1c",
            padding: 16,
            fontFamily: "ui-monospace, monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>CometChat failed to initialize.</strong>
          <div style={{ marginTop: 8 }}>{error}</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            See the browser console for the full error object and any [CometChat
            hint] line above it.
          </div>
        </div>
      </CometChatContext.Provider>
    );
  }

  if (!isReady) {
    return null; // Loading — children gate closed
  }

  return (
    <CometChatContext.Provider value={{ isReady, error }}>
      {children}
    </CometChatContext.Provider>
  );
}
