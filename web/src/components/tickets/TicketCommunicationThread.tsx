import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTicketComments, useAddComment } from '@/hooks/useComments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Bot, User as UserIcon, ShieldAlert, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import type { Ticket } from '@/types';

interface Props {
  ticket: Ticket;
}

export function TicketCommunicationThread({ ticket }: Props) {
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useTicketComments(ticket.id);
  const addCommentMutation = useAddComment(ticket.id);
  const [newComment, setNewComment] = useState('');

  const handleSend = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment, {
      onSuccess: () => setNewComment(''),
    });
  };

  if (isLoading) {
    return <SkeletonLoader type="card" />;
  }

  const isClosed = ticket.status === 'closed';

  return (
    <Card>
      <div className="flex items-center gap-2 section-label">
        <MessageSquare size={14} />
        Communication Thread
      </div>
      
      <div className="mt-6 space-y-6">
        {(!comments || comments.length === 0) ? (
          <div className="text-center py-8 text-[var(--color-muted)] text-sm italic">
            No messages yet.
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {comments.map((comment) => {
              const isMine = comment.userId === user?.id;
              const isAgent = comment.user.role === 'agent' || comment.user.role === 'supervisor';
              const isAdmin = comment.user.role === 'admin';

              return (
                <div key={comment.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 text-xs text-[var(--color-muted)]">
                    {comment.isAi ? (
                      <><Bot size={12} className="text-[var(--color-brand-red)]" /> AI Assistant</>
                    ) : isAgent ? (
                      <><ShieldAlert size={12} className="text-amber-500" /> {comment.user.name} ({comment.user.role})</>
                    ) : isAdmin ? (
                      <><ShieldAlert size={12} className="text-red-500" /> {comment.user.name} (Admin)</>
                    ) : (
                      <><UserIcon size={12} /> {comment.user.name}</>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div 
                    style={{
                      maxWidth: '85%',
                      padding: '1rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.625',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid',
                      borderColor: comment.isAi || isMine ? 'transparent' : 'var(--theme-border)',
                      background: comment.isAi
                        ? '#FF4655'
                        : isMine
                          ? '#0F1923'
                          : 'var(--theme-surface)',
                      color: comment.isAi || isMine
                        ? '#ffffff'
                        : 'var(--theme-text-main)',
                    }}
                  >
                    {comment.body}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isClosed && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="form-textarea min-h-[80px]"
              placeholder="Type your message here..."
              disabled={addCommentMutation.isPending}
            />
            <div className="mt-3 flex justify-end">
              <Button 
                onClick={handleSend} 
                isLoading={addCommentMutation.isPending}
                disabled={!newComment.trim()}
              >
                <Send size={16} />
                Send Message
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
