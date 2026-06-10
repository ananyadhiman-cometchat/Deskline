import { MessageSquare } from 'lucide-react'

export function ChatPlaceholder() {
  return (
    <div className="chat-placeholder mt-6">
      <MessageSquare className="mx-auto mb-4 h-8 w-8 text-[var(--color-muted)] opacity-50" />
      <div className="chat-placeholder-label">CometChat Integration</div>
      <div className="chat-placeholder-title">Live Chat Coming in Step 2</div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        This conversation ticket will automatically open a real-time chat window once Step 2 is implemented.
      </p>
    </div>
  )
}
