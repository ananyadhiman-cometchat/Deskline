import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useSendAnnouncement } from '@/hooks/useAdmin'

export default function AnnouncementsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetRole, setTargetRole] = useState('all')

  const { mutate: sendAnnouncement, isPending } = useSendAnnouncement()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    sendAnnouncement(
      {
        title: title.trim(),
        body: body.trim(),
        targetRole: targetRole === 'all' ? undefined : targetRole,
      },
      {
        onSuccess: () => {
          setTitle('')
          setBody('')
          setTargetRole('all')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Send Announcement</h1>
        <p className="text-[var(--color-muted)]">
          Broadcast a push notification to all users or a specific role group.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-lg mx-auto">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '8px' }}>
            <Megaphone size={18} className="text-[var(--color-brand-red)] flex-shrink-0" style={{ display: 'block' }} />
            <span style={{ fontFamily: 'var(--font-family-heading)', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-brand-red)', lineHeight: '18px', margin: 0 }}>Compose Announcement</span>
          </div>

          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Maintenance Tonight"
            maxLength={120}
          />

          <Textarea
            label="Message"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the announcement..."
            rows={4}
            maxLength={500}
          />

          <Select
            label="Target Audience"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            options={[
              { value: 'all', label: 'All Users' },
              { value: 'employee', label: 'Employees Only' },
              { value: 'agent', label: 'Agents Only' },
              { value: 'supervisor', label: 'Supervisors Only' },
              { value: 'admin', label: 'Admins Only' },
            ]}
          />

          <div className="pt-2">
            <Button type="submit" disabled={isPending || !title.trim() || !body.trim()}>
              {isPending ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
