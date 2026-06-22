import { CometChatIncomingCall } from "@cometchat/chat-uikit-react";
import { useCometChat } from "../CometChatProvider";

// ============================================================
// IncomingCallHandler — Incoming call listener at app root
// ============================================================
// This component MUST be mounted at the app root level (outside
// specific ticket routes) so that incoming calls ring regardless
// of the current page.
//
// The call UI (incoming ring + ongoing call) is wrapped in a fixed
// fullscreen container so it overlays the entire app, covering both
// the chat section and the rest of the page content.

/**
 * IncomingCallHandler listens for incoming CometChat calls and
 * displays the ringing UI (accept/decline) as a full-screen overlay.
 *
 * Mount this component at the root of the application (e.g., in AppLayout)
 * so that calls ring on any page the user is on.
 *
 * When there is no incoming call, this component renders nothing visible.
 * When a call arrives:
 * - Shows caller info with accept/decline buttons (fullscreen overlay)
 * - On accept: transitions to the ongoing call UI with controls
 *   (mute, camera toggle, end call) — also fullscreen
 * - On decline: dismisses the ringing UI
 * - Auto-dismisses after 30 seconds if no response (missed call)
 */
export function IncomingCallHandler() {
  const { isReady, error } = useCometChat();

  // Don't mount the listener if SDK isn't ready or has errored
  if (!isReady || error) {
    return null;
  }

  return (
    <div className="cometchat-call-overlay">
      <CometChatIncomingCall />
    </div>
  );
}
