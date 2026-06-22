import { CometChatCallButtons } from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useMemo } from "react";
import { useCometChat } from "../CometChatProvider";

// ============================================================
// CallButtons — CometChat call buttons for ticket detail header
// ============================================================
// Renders audio/video call buttons in Ringing Mode.
// Accepts a `user` prop — either a CometChat User object or a UID string.
//
// NOTE: Do NOT render this if the parent already provides
// CometChatCallButtons (e.g., CometChatMessageHeader does this by default).
// This component is for standalone placement in the ticket detail header.

export interface CallButtonsProps {
  /** CometChat User object or UID string of the other party */
  user: CometChat.User | string;
}

/**
 * CallButtons renders CometChatCallButtons configured for 1:1 Ringing Mode calls.
 *
 * - If `user` is a string (UID), it constructs a CometChat.User object internally
 * - Only renders when CometChat SDK is ready
 * - Shows nothing when SDK has errored (calling unavailable)
 */
export function CallButtons({ user }: CallButtonsProps) {
  const { isReady, error } = useCometChat();

  // Build CometChat User object from UID string if needed
  const cometChatUser = useMemo(() => {
    if (typeof user === "string") {
      return new CometChat.User(user);
    }
    return user;
  }, [user]);

  // Don't render when SDK is not ready or errored
  if (!isReady || error) {
    return null;
  }

  return (
    <div className="cometchat-call-buttons-wrapper">
      <CometChatCallButtons user={cometChatUser} />
    </div>
  );
}
