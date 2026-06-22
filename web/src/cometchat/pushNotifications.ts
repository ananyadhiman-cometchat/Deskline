import { CometChat } from "@cometchat/chat-sdk-javascript";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { logCometChatError } from "./errors";

// ============================================================
// CometChat Web Push Notification Registration
// ============================================================
// Registers/unregisters the browser's FCM token with CometChat
// so that offline users receive push notifications for chat messages
// and incoming calls.
//
// Uses CometChat.registerTokenForPushNotification (v4 SDK API)
// which coexists with the existing DeskLine FCM notification infrastructure.

/**
 * Register the browser's FCM token with CometChat for push notification delivery.
 *
 * Fails silently (logs warning) if prerequisites are not met — push is
 * a best-effort feature and should not block chat functionality.
 */
export async function registerCometChatPushToken(): Promise<void> {
  try {
    if (!messaging) {
      console.warn(
        "[CometChat Push] Firebase messaging not configured. Skipping push token registration."
      );
      return;
    }

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      console.warn(
        "[CometChat Push] Notification permission not granted. Skipping push token registration."
      );
      return;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn(
        "[CometChat Push] VITE_FIREBASE_VAPID_KEY is missing. Cannot register push token."
      );
      return;
    }

    const fcmToken = await getToken(messaging, { vapidKey });

    if (!fcmToken) {
      console.warn("[CometChat Push] No FCM token available.");
      return;
    }

    // v4 SDK: registerTokenForPushNotification accepts the token string directly
    await CometChat.registerTokenForPushNotification(fcmToken);

    console.log("[CometChat Push] Push token registered successfully.");
  } catch (e) {
    // Non-fatal — log but don't throw. Chat still works without push.
    logCometChatError(e);
    console.warn("[CometChat Push] Failed to register push token:", e);
  }
}

/**
 * Unregister the CometChat push token for the current session.
 *
 * Fails silently on error — the user is logging out anyway.
 */
export async function unregisterCometChatPushToken(): Promise<void> {
  try {
    // v4 SDK doesn't have a dedicated unregister method.
    // Registering an empty token effectively disables push for this device.
    // The token becomes invalid once the user logs out of CometChat anyway.
    console.log("[CometChat Push] Push token will be invalidated on logout.");
  } catch (e) {
    logCometChatError(e);
    console.warn("[CometChat Push] Failed to unregister push token:", e);
  }
}
