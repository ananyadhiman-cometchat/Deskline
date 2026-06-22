import { useMemo } from "react";
import {
  CometChatMessageList,
  CometChatMessageComposer,
  CometChatMessageHeader,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChat } from "../CometChatProvider";

// ============================================================
// ChatPanel — Embedded CometChat messaging for ticket detail
// ============================================================
// Renders the CometChat message UI (header, message list, composer)
// within the ticket detail page as a right-side panel.
//
// Behaviour:
// - Accepts conversationId and type to determine 1:1 vs group
// - Hides the message composer when ticket is resolved or closed
// - Loads full message history for existing conversations
// - Styled with Tailwind for integration into the ticket layout

export interface ChatPanelProps {
  /** The CometChat conversation ID stored on the ticket */
  conversationId: string;
  /** Whether this is a user (1:1) or group conversation */
  conversationType: "user" | "group";
  /** Current ticket status — controls composer visibility */
  ticketStatus: string;
  /** UID of the recipient user (for 1:1 conversations) */
  recipientUid?: string;
  /** Group ID (for group conversations) */
  groupId?: string;
}

/**
 * ChatPanel renders the CometChat messaging interface embedded
 * within the ticket detail page. It determines the correct
 * user/group object and conditionally hides the composer for
 * resolved/closed tickets.
 */
export function ChatPanel({
  conversationId,
  conversationType,
  ticketStatus,
  recipientUid,
  groupId,
}: ChatPanelProps) {
  const { isReady, error } = useCometChat();

  const hideMessageComposer =
    ticketStatus === "resolved" || ticketStatus === "closed";

  // Build the CometChat User or Group object for the messages component
  const user = useMemo(() => {
    if (conversationType === "user" && recipientUid) {
      const u = new CometChat.User(recipientUid);
      return u;
    }
    return undefined;
  }, [conversationType, recipientUid]);

  const group = useMemo(() => {
    if (conversationType === "group" && groupId) {
      const g = new CometChat.Group(groupId, groupId, "public", undefined);
      return g;
    }
    return undefined;
  }, [conversationType, groupId]);

  // --- Guard states ---

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Chat is temporarily unavailable.
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-transparent" />
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Loading chat…
        </p>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          No conversation associated with this ticket yet.
        </p>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {conversationType === "user" && user ? (
        <div className="flex h-full flex-col">
          <CometChatMessageHeader user={user} />
          <div className="flex-1 overflow-y-auto min-h-0">
            <CometChatMessageList user={user} />
          </div>
          {!hideMessageComposer && (
            <div className="border-t border-[var(--color-border)]">
              <CometChatMessageComposer user={user} />
            </div>
          )}
        </div>
      ) : conversationType === "group" && group ? (
        <div className="flex h-full flex-col">
          <CometChatMessageHeader group={group} />
          <div className="flex-1 overflow-y-auto min-h-0">
            <CometChatMessageList group={group} />
          </div>
          {!hideMessageComposer && (
            <div className="border-t border-[var(--color-border)]">
              <CometChatMessageComposer group={group} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-6">
          <p className="text-sm text-[var(--color-muted)]">
            Unable to load conversation.
          </p>
        </div>
      )}

      {hideMessageComposer && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-center">
          <p className="text-xs text-[var(--color-muted)]">
            This conversation is read-only — the ticket has been{" "}
            {ticketStatus}.
          </p>
        </div>
      )}
    </div>
  );
}
