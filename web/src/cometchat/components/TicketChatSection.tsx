import { useEffect, useState } from "react";
import {
  CometChatMessageList,
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatUIKit,
} from "@cometchat/chat-uikit-react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChat } from "../CometChatProvider";
import { MessageSquare, Users, Circle, Maximize2, Minimize2 } from "lucide-react";

// ============================================================
// TicketChatSection — Full CometChat messaging + calling + participants
// ============================================================
// Layout: [Participants Sidebar (left)] [Chat Area (right)]
// - Participants panel shows all conversation members with live presence
// - Chat area uses CometChat UI Kit components which handle:
//   - Message alignment (outgoing = right, incoming = left)
//   - Sender names and avatars + timestamps
//   - Voice + video call buttons (rendered automatically by
//     CometChatMessageHeader when a group prop is set — see
//     cometchat-react-calls skill rule 1.9: do NOT add a second
//     CometChatCallButtons or they appear twice)
//
// All ticket conversations are group-based to allow admin/supervisor intercept.

export interface TicketChatSectionProps {
  /** The CometChat group GUID stored on the ticket (cometchatConvoId) */
  conversationId: string;
  /** Current ticket status — controls composer visibility */
  ticketStatus: string;
  /** Ticket sub-type — determines default participants */
  subType?: string;
  /** Employee info from ticket */
  employee?: { id: string; name: string; email?: string; department?: string } | null;
  /** Agent info from ticket */
  agent?: { id: string; name: string; email?: string; department?: string } | null;
}

interface Participant {
  uid: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
  role?: string;
}

export function TicketChatSection({
  conversationId,
  ticketStatus,
  subType,
  employee,
  agent,
}: TicketChatSectionProps) {
  const { isReady, error } = useCometChat();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resolvedGroup, setResolvedGroup] = useState<CometChat.Group | undefined>();

  const hideMessageComposer =
    ticketStatus === "resolved" || ticketStatus === "closed";

  // When the ticket is resolved or closed, calls must be fully disabled.
  // CometChatMessageHeader renders audio/video call buttons via its
  // internal auxiliaryButtonView. We override that view to render nothing
  // (null), which removes the call buttons for all roles on this ticket.
  const hideCallButtons = hideMessageComposer; // same condition: resolved | closed

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isFullscreen]);

  // Resolve the CometChat Group object from the API
  useEffect(() => {
    if (!isReady || !conversationId) return;

    async function resolve() {
      try {
        const group = await CometChat.getGroup(conversationId);
        setResolvedGroup(group);
      } catch (err) {
        console.error("[TicketChatSection] Failed to resolve group:", err);
        // Fallback to constructed group object
        setResolvedGroup(new CometChat.Group(conversationId, conversationId, "private", undefined));
      }
    }

    resolve();
  }, [isReady, conversationId]);

  // Fetch group members for the participants panel
  useEffect(() => {
    if (!isReady || !conversationId) return;

    async function fetchParticipants() {
      try {
        const groupMemberRequest = new CometChat.GroupMembersRequestBuilder(conversationId)
          .setLimit(30)
          .build();
        const members = await groupMemberRequest.fetchNext();
        const participantList: Participant[] = members.map((member) => {
          // Determine the DeskLine role from CometChat user tags
          // Tags are set during user sync as ["role:agent", "dept:IT"] etc.
          let displayRole: string | undefined;
          
          // First try to match by known UIDs from the ticket data
          if (agent && member.getUid() === agent.id) {
            displayRole = "Agent";
          } else if (employee && member.getUid() === employee.id) {
            displayRole = "Employee";
          } else {
            // For other members (admin/supervisor who intercepted), read from tags
            const tags = member.getTags?.() ?? [];
            const roleTag = tags.find((t: string) => t.startsWith("role:"));
            if (roleTag) {
              const role = roleTag.replace("role:", "");
              // Capitalize first letter
              displayRole = role.charAt(0).toUpperCase() + role.slice(1);
            } else {
              // Last fallback based on CometChat group scope
              const scope = member.getScope?.();
              if (scope === "admin") {
                displayRole = "Admin";
              } else if (scope === "moderator") {
                displayRole = "Supervisor";
              } else {
                displayRole = "Member";
              }
            }
          }
          
          return {
            uid: member.getUid(),
            name: member.getName(),
            avatar: member.getAvatar(),
            status: (member.getStatus() as "online" | "offline" | "away") || "offline",
            role: displayRole,
          };
        });
        setParticipants(participantList);
      } catch (err) {
        console.error("[TicketChatSection] Failed to fetch participants:", err);
        // Fallback to ticket data
        const fallback: Participant[] = [];
        if (employee) {
          fallback.push({ uid: employee.id, name: employee.name, status: "offline", role: "Employee" });
        }
        if (agent) {
          fallback.push({ uid: agent.id, name: agent.name, status: "offline", role: "Agent" });
        } else if (subType === "information") {
          fallback.push({ uid: "ai-agent", name: "AI Assistant", status: "online", role: "AI" });
        }
        setParticipants(fallback);
      }
    }

    fetchParticipants();

    // Listen for presence changes
    const listenerID = `ticket_chat_presence_${conversationId}`;
    CometChat.addUserListener(
      listenerID,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === onlineUser.getUid() ? { ...p, status: "online" } : p
            )
          );
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.uid === offlineUser.getUid() ? { ...p, status: "offline" } : p
            )
          );
        },
      })
    );

    return () => {
      CometChat.removeUserListener(listenerID);
    };
  }, [isReady, conversationId, employee, agent, subType]);

  // --- Guard states ---

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-2 section-label mb-4">
          <MessageSquare size={14} />
          Communication Thread
        </div>
        <p className="text-sm text-[var(--color-muted)] text-center py-8">
          Chat is temporarily unavailable. Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-2 section-label mb-4">
          <MessageSquare size={14} />
          Communication Thread
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-transparent" />
          <p className="ml-3 text-sm text-[var(--color-muted)]">Loading chat…</p>
        </div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-2 section-label mb-4">
          <MessageSquare size={14} />
          Communication Thread
        </div>
        <p className="text-sm text-[var(--color-muted)] text-center py-8 italic">
          No conversation started yet. The chat will appear here once the ticket is assigned.
        </p>
      </div>
    );
  }

  // Wait for group resolution before rendering
  if (!resolvedGroup) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-transparent" />
          <p className="ml-3 text-sm text-[var(--color-muted)]">Loading conversation…</p>
        </div>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className={`ticket-chat-section overflow-hidden ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-lg border border-[var(--color-border)]"}`}>
      {/* Header bar with section label + fullscreen toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
        <div className="flex items-center gap-2 section-label mb-0">
          <MessageSquare size={14} />
          Communication Thread
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded text-[var(--color-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-border)] transition-colors"
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Participants (left) + Chat (right) Layout */}
      <div className="flex flex-1 min-h-0 relative" style={{ height: isFullscreen ? "calc(100vh - 45px)" : "575px" }}>
        {/* Mobile Backdrop */}
        {showParticipants && (
          <div 
            className="md:hidden absolute inset-0 z-20 bg-black/50" 
            onClick={() => setShowParticipants(false)}
            aria-hidden="true"
          />
        )}

        {/* Participants Sidebar — LEFT side */}
        {showParticipants && (
          <div className="absolute inset-y-0 left-0 z-30 w-64 md:relative md:w-52 md:z-auto border-r border-[var(--color-border)] bg-[var(--theme-bg)] shadow-2xl md:shadow-none overflow-y-auto flex-shrink-0 transition-transform">
            <div className="px-3 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-muted)]">
                Participants ({participants.length})
              </h4>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-border)] transition-colors"
                title="Hide participants"
                aria-label="Hide participants panel"
              >
                <Users size={14} />
              </button>
            </div>
            <div className="p-2 space-y-0.5">
              {participants.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] text-center py-4 italic">
                  Loading…
                </p>
              ) : (
                participants.map((participant) => (
                  <div
                    key={participant.uid}
                    className="flex items-center gap-2.5 px-2 py-2.5 rounded hover:bg-[var(--color-surface)] transition-colors"
                  >
                    {/* Avatar with status dot */}
                    <div className="relative flex-shrink-0">
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-[var(--color-border)]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#FF4655] flex items-center justify-center text-white text-xs font-semibold border-2 border-[var(--color-border)]">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <Circle
                        size={10}
                        className={`absolute -bottom-0.5 -right-0.5 fill-current ${
                          participant.status === "online"
                            ? "text-green-500"
                            : participant.status === "away"
                            ? "text-amber-500"
                            : "text-gray-400"
                        }`}
                        strokeWidth={2.5}
                        stroke="var(--color-background)"
                      />
                    </div>
                    {/* Name + Role + Status */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--theme-text-main)] truncate leading-tight">
                        {participant.name}
                      </p>
                      <p className="text-[10px] leading-tight mt-0.5">
                        {participant.role && (
                          <span className="font-semibold text-[var(--color-brand-red)]">{participant.role}</span>
                        )}
                        {participant.role && <span className="text-[var(--color-muted)]"> · </span>}
                        <span className={
                          participant.status === "online"
                            ? "text-green-500 font-medium"
                            : participant.status === "away"
                            ? "text-amber-500 font-medium"
                            : "text-[var(--color-muted)]"
                        }>
                          {participant.status === "online" ? "Online" : participant.status === "away" ? "Away" : "Offline"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Area — RIGHT side */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Message Header with call buttons */}
          <div className="relative border-b border-[var(--color-border)] flex-shrink-0">
            {/* Show participants toggle when panel is hidden */}
            {!showParticipants && (
              <button
                onClick={() => setShowParticipants(true)}
                className="absolute top-3 left-3 z-10 p-1.5 rounded bg-[var(--color-navy)] text-white shadow-sm hover:bg-[var(--color-brand-red)] transition-colors"
                title="Show participants"
                aria-label="Show participants panel"
              >
                <Users size={14} />
              </button>
            )}
            {/*
              CometChatMessageHeader automatically renders audio + video call
              buttons via its auxiliaryButtonView. When the ticket is resolved
              or closed we override that view to render nothing so no call can
              be initiated on a terminated conversation from any role.
            */}
            <CometChatMessageHeader
              group={resolvedGroup}
              {...(hideCallButtons && {
                auxiliaryButtonView: (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-muted)",
                      padding: "0 12px",
                      fontStyle: "italic",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Calls disabled
                  </span>
                ),
              })}
            />
          </div>

          {/* Messages — bounded height container for scroll to work */}
          <div className={`ticket-chat-message-list-wrapper ${hideCallButtons ? 'calls-disabled' : ''}`}>
            <CometChatMessageList 
              group={resolvedGroup} 
              templates={
                hideCallButtons 
                  ? CometChatUIKit.getDataSource().getAllMessageTemplates().map((t: any) => {
                      if (t.type === 'meeting') {
                        t.contentView = () => (
                          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-3 text-center opacity-70">
                            <span className="text-xs italic text-[var(--color-muted)]">Call ended</span>
                          </div>
                        );
                      }
                      return t;
                    })
                  : undefined
              }
            />
          </div>

          {/* Composer */}
          {!hideMessageComposer ? (
            <div className="border-t border-[var(--color-border)] flex-shrink-0">
              <CometChatMessageComposer group={resolvedGroup} />
            </div>
          ) : (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-center flex-shrink-0">
              <p className="text-xs text-[var(--color-muted)]">
                This conversation is read-only — the ticket has been {ticketStatus}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
