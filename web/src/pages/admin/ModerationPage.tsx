import { ModerationQueue } from '@/cometchat'

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Content Moderation</h1>
        <p className="text-[var(--color-muted)]">Review and action flagged chat messages.</p>
      </div>

      <ModerationQueue />
    </div>
  )
}
