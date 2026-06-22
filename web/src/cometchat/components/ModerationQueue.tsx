import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ShieldAlert, Ban, XCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ============================================================
// Types
// ============================================================

interface ModerationItem {
  id: string;
  messageId: string;
  conversationId: string;
  ticketId: string | null;
  senderUid: string;
  senderName: string;
  messageContent: string;
  flagReason: string;
  flaggedAt: string;
  status: "pending" | "dismissed" | "blocked";
}

interface ModerationListResponse {
  items: ModerationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Query keys
// ============================================================

const MODERATION_QUERY_KEY = "admin-moderation";

// ============================================================
// ModerationQueue Component
// ============================================================

export function ModerationQueue() {
  const queryClient = useQueryClient();
  const showToast = useUIStore.getState().showToast;

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Block confirm dialog state
  const [blockTarget, setBlockTarget] = useState<ModerationItem | null>(null);

  // --- Fetch flagged messages ---
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<ModerationListResponse>({
    queryKey: [MODERATION_QUERY_KEY, { page, limit: pageSize }],
    queryFn: async () => {
      const { data } = await api.get<{ data: ModerationListResponse }>(
        "/api/admin/moderation",
        { params: { page, limit: pageSize } }
      );
      return data.data ?? (data as unknown as ModerationListResponse);
    },
  });

  // --- Dismiss mutation ---
  const dismissMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.post(`/api/admin/moderation/${itemId}/action`, {
        action: "dismiss",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODERATION_QUERY_KEY] });
      showToast({ type: "success", title: "Dismissed", message: "Flagged message dismissed." });
    },
    onError: () => {
      showToast({ type: "error", title: "Error", message: "Failed to dismiss the flagged message." });
    },
  });

  // --- Block sender mutation ---
  const blockMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.post(`/api/admin/moderation/${itemId}/action`, {
        action: "block",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MODERATION_QUERY_KEY] });
      setBlockTarget(null);
      showToast({ type: "success", title: "Sender Blocked", message: "The sender has been blocked." });
    },
    onError: () => {
      setBlockTarget(null);
      showToast({ type: "error", title: "Error", message: "Failed to block the sender." });
    },
  });

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[var(--color-brand-red)] mb-3" />
          <p className="text-sm text-[var(--color-muted)]">
            {error instanceof Error ? error.message : "Failed to load moderation queue."}
          </p>
        </Card>
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // --- Empty state ---
  if (items.length === 0 && page === 1) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldAlert className="h-10 w-10 text-[var(--color-muted)]" />}
          title="No flagged messages"
          description="The moderation queue is clear. Flagged messages will appear here automatically."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-[var(--color-navy)]">
          Moderation Queue
        </h2>
        <Badge variant="high">{total} flagged</Badge>
      </div>

      {/* Flagged message cards */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Sender & timestamp */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-[var(--color-navy)]">
                    {item.senderName}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    ({item.senderUid})
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    &middot;{" "}
                    {formatDistanceToNow(new Date(item.flaggedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Message content */}
                <p className="text-sm text-[var(--color-navy)] bg-[var(--theme-surface)] rounded px-3 py-2 border border-[var(--color-border)] break-words">
                  {item.messageContent}
                </p>

                {/* Metadata row */}
                <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--color-muted)]">
                  <span>
                    <strong>Reason:</strong> {item.flagReason}
                  </span>
                  {item.ticketId && (
                    <span>
                      <strong>Ticket:</strong> {item.ticketId}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissMutation.mutate(item.id)}
                  disabled={dismissMutation.isPending || blockMutation.isPending}
                  isLoading={
                    dismissMutation.isPending &&
                    dismissMutation.variables === item.id
                  }
                  aria-label={`Dismiss flagged message from ${item.senderName}`}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Dismiss
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setBlockTarget(item)}
                  disabled={dismissMutation.isPending || blockMutation.isPending}
                  aria-label={`Block sender ${item.senderName}`}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Block Sender
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      )}

      {/* Block Sender Confirm Dialog */}
      <ConfirmDialog
        isOpen={blockTarget !== null}
        onClose={() => setBlockTarget(null)}
        onConfirm={() => {
          if (blockTarget) {
            blockMutation.mutate(blockTarget.id);
          }
        }}
        title="Block Sender"
        description={`This will deactivate ${blockTarget?.senderName}'s CometChat account and prevent them from sending further messages. This action cannot be easily undone.`}
        confirmText="Block Sender"
        cancelText="Cancel"
        isDestructive
        isLoading={blockMutation.isPending}
      />
    </div>
  );
}
