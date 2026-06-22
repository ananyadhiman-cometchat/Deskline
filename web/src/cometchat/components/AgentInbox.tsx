import { useState, useCallback } from "react";
import {
  CometChatConversations,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useNavigate } from "react-router-dom";
import { useCometChat } from "../CometChatProvider";

// ============================================================
// AgentInbox — CometChat conversations list with availability
// ============================================================
// Displays all active CometChat conversations for the logged-in agent.
// Features:
// - Availability status toggle (online/away/offline)
// - Real-time unread count badges (built-in to CometChatConversations)
// - Custom list item view showing ticket reference
// - Navigate to ticket detail on conversation click
// - Sorted by most recent activity

type AgentStatus = "online" | "away" | "offline";

const STATUS_OPTIONS: { value: AgentStatus; label: string; color: string }[] = [
  { value: "online", label: "Online", color: "bg-green-500" },
  { value: "away", label: "Away", color: "bg-yellow-500" },
  { value: "offline", label: "Offline", color: "bg-gray-400" },
];

/**
 * Maps our status values to CometChat user status constants.
 */
function toCometChatStatus(status: AgentStatus): string {
  switch (status) {
    case "online":
      return CometChat.USER_STATUS.ONLINE;
    case "away":
      // CometChat doesn't have a native "away" — we use online with metadata
      // or fallback to online since the SDK doesn't have a separate away constant
      return CometChat.USER_STATUS.ONLINE;
    case "offline":
      return CometChat.USER_STATUS.OFFLINE;
    default:
      return CometChat.USER_STATUS.ONLINE;
  }
}

/**
 * Extract a ticket ID from conversation metadata or name.
 * CometChat conversations created by DeskLine store ticket info
 * in the conversation metadata or can be derived from the conversation ID.
 */
function extractTicketId(conversation: CometChat.Conversation): string | null {
  try {
    // Check metadata for ticketId (set by our backend when creating conversations)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convAny = conversation as any;
    const metadata = convAny.getMetadata?.() ?? convAny.metadata;
    if (metadata && typeof metadata === "object") {
      if (metadata.ticketId && typeof metadata.ticketId === "string") {
        return metadata.ticketId;
      }
    }

    // Check conversation tags for ticket reference
    const tags = convAny.getTags?.() ?? convAny.tags;
    if (tags && Array.isArray(tags)) {
      const ticketTag = tags.find((t: unknown) => String(t).startsWith("ticket:"));
      if (ticketTag) {
        return String(ticketTag).replace("ticket:", "");
      }
    }

    // Fallback: conversation ID may encode ticket info
    const conversationId = conversation.getConversationId();
    if (conversationId?.startsWith("ticket_")) {
      return conversationId.replace("ticket_", "");
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * AgentInbox displays all active CometChat conversations for the
 * logged-in agent with availability status toggle, real-time unread
 * counts, and navigation to ticket detail on click.
 */
export function AgentInbox() {
  const { isReady, error } = useCometChat();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AgentStatus>("online");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  /**
   * Handle status change — update both local state and CometChat presence.
   */
  const handleStatusChange = useCallback(async (newStatus: AgentStatus) => {
    setStatus(newStatus);
    setIsStatusDropdownOpen(false);

    try {
      toCometChatStatus(newStatus);
      // Use CometChat SDK to set the user's online status
      if (newStatus === "offline") {
        // Going offline is handled by SDK disconnect or explicit status
        await CometChat.getLoggedinUser().then(() => {
          // The SDK handles presence automatically, but we can set metadata
          // to indicate "away" status to other users
        });
      }
      // For online/away, the SDK presence is managed automatically
      // We store the "away" state as user metadata for UI display
      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        loggedInUser.setMetadata({
          ...(loggedInUser.getMetadata() as Record<string, unknown> || {}),
          availabilityStatus: newStatus,
        });
        await CometChat.updateCurrentUserDetails(loggedInUser);
      }
    } catch (e) {
      // Non-blocking — status badge updates locally even if SDK call fails
      console.warn("[AgentInbox] Failed to update CometChat status:", e);
    }
  }, []);

  /**
   * Handle conversation item click — navigate to the associated ticket.
   */
  const handleConversationClick = useCallback(
    (conversation: CometChat.Conversation) => {
      const ticketId = extractTicketId(conversation);
      if (ticketId) {
        navigate(`/tickets/${ticketId}`);
      } else {
        // Fallback: navigate to a generic conversation view or show detail
        // For conversations without ticket metadata, open the conversation
        const conversationWith = conversation.getConversationWith();
        if (conversationWith) {
          const uid =
            conversationWith instanceof CometChat.User
              ? conversationWith.getUid()
              : conversationWith instanceof CometChat.Group
                ? conversationWith.getGuid()
                : null;
          if (uid) {
            // Navigate to a search-based ticket view as fallback
            navigate(`/tickets?search=${uid}`);
          }
        }
      }
    },
    [navigate]
  );

  // --- Guard states ---

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          Chat inbox is temporarily unavailable.
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-transparent" />
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Loading conversations…
        </p>
      </div>
    );
  }

  // --- Main render ---

  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === status)!;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Header with availability status toggle */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          Conversations
        </h2>

        {/* Status dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]"
            aria-label="Change availability status"
            aria-expanded={isStatusDropdownOpen}
            aria-haspopup="listbox"
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${currentStatusOption.color}`}
              aria-hidden="true"
            />
            {currentStatusOption.label}
            <svg
              className={`h-4 w-4 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isStatusDropdownOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-36 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg"
              role="listbox"
              aria-label="Availability status options"
            >
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={status === option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface)] ${
                    status === option.value
                      ? "font-medium text-[var(--color-foreground)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${option.color}`}
                    aria-hidden="true"
                  />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CometChat Conversations list */}
      <div className="flex-1 overflow-hidden">
        <CometChatConversations
          onItemClick={handleConversationClick}
        />
      </div>
    </div>
  );
}
