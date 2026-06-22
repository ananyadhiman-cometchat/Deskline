import { AgentInbox } from '@/cometchat'

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Conversations</h1>
        <p className="text-[var(--color-muted)]">Real-time chat conversations with employees.</p>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[400px]">
        <AgentInbox />
      </div>
    </div>
  )
}
