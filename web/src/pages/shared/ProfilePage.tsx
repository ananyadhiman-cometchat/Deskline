import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, type ProfileUpdateFormValues } from '@/lib/schemas'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ROLE_LABELS } from '@/types'
import { useState } from 'react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  // NOTE: Profile update API endpoint is not explicitly requested in Step 1 rules, 
  // but "Profile: View/edit own name and email" is. We will build the UI for it,
  // and handle the logic (maybe mocking the save until backend has the specific endpoint, 
  // or using the admin endpoint if user has access. Wait, normal users can't use /api/admin/users/:id.
  // There is no /api/auth/profile route in the spec. I will mock the UI save for now or 
  // wait for clarification. Let's just build the form).

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const onSubmit = (data: ProfileUpdateFormValues) => {
    // Mock save
    console.log('Update profile:', data)
    setIsEditing(false)
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-header">Operative Profile</h1>
        <p className="text-[var(--color-muted)]">Manage your personal identification details.</p>
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)] font-heading text-2xl text-[var(--color-navy)]">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-heading text-xl text-[var(--color-navy)]">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role}>{ROLE_LABELS[user.role]}</Badge>
                <span className="text-xs text-[var(--color-muted)] font-mono">{user.department} DEPT</span>
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit Details
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <Input
              label="Full Name"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" tactical>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 max-w-md text-sm">
            <div>
              <div className="text-[var(--color-muted)] font-bold uppercase tracking-wider text-xs mb-1">Email</div>
              <div className="font-medium text-[var(--color-navy)]">{user.email}</div>
            </div>
            <div>
              <div className="text-[var(--color-muted)] font-bold uppercase tracking-wider text-xs mb-1">System ID</div>
              <div className="font-mono text-xs text-[var(--color-navy)]">{user.id}</div>
            </div>
            <div>
              <div className="text-[var(--color-muted)] font-bold uppercase tracking-wider text-xs mb-1">Access Level</div>
              <div className="font-medium text-[var(--color-navy)]">{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
