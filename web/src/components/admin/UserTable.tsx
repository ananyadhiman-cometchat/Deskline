import type { User } from '@/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ROLE_LABELS } from '@/types'
import { format } from 'date-fns'
import { Edit2, ShieldOff } from 'lucide-react'

export interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
}

export function UserTable({ users, onEdit, onDeactivate }: UserTableProps) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Joined</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={!user.isActive ? 'table-row-inactive' : ''}>
              <td className="font-semibold">{user.name} {!user.isActive && <span className="ml-2 text-xs text-[var(--color-brand-red)]">(Deactivated)</span>}</td>
              <td className="text-[var(--color-muted)]">{user.email}</td>
              <td><Badge variant={user.role}>{ROLE_LABELS[user.role]}</Badge></td>
              <td>{user.department}</td>
              <td className="text-[var(--color-muted)] text-xs">
                {format(new Date(user.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(user)} aria-label="Edit user">
                    <Edit2 size={14} />
                  </Button>
                  {user.isActive && (
                    <Button variant="ghost" size="sm" onClick={() => onDeactivate(user)} aria-label="Deactivate user" className="text-[var(--color-brand-red)] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-[var(--color-brand-red)]">
                      <ShieldOff size={14} />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
