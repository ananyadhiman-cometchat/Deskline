import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '@/hooks/useAdmin'
import { UserTable } from '@/components/admin/UserTable'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userCreateSchema, userUpdateSchema, type UserCreateFormValues, type UserUpdateFormValues } from '@/lib/schemas'
import type { User, UserFilters } from '@/types'
import { Plus, Users } from 'lucide-react'

export default function UserManagementPage() {
  const [filters, setFilters] = useState<UserFilters>({ page: 1, pageSize: 15 })
  const { data, isLoading, isError, error } = useUsers(filters)

  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null)

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser(editingUser?.id || '')
  const deactivateUserMutation = useDeactivateUser(deactivatingUser?.id || '')

  // Create Form
  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: { role: 'employee', department: 'General' }
  })

  // Edit Form
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema)
  })

  const openEditModal = (user: User) => {
    setEditingUser(user)
    resetEdit({ name: user.name, email: user.email, role: user.role, department: user.department })
  }

  const onCreate = (data: UserCreateFormValues) => {
    createUserMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false)
        resetCreate()
      }
    })
  }

  const onEdit = (data: UserUpdateFormValues) => {
    updateUserMutation.mutate(data, {
      onSuccess: () => setEditingUser(null)
    })
  }

  const onDeactivate = () => {
    deactivateUserMutation.mutate(undefined, {
      onSuccess: () => setDeactivatingUser(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-6">
        <div>
          <h1 className="page-header">Personnel Roster</h1>
          <p className="text-[var(--color-muted)]">Manage system access and roles.</p>
        </div>
        <Button tactical onClick={() => setCreateModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus size={18} />
          Provision Access
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          className="max-w-[200px]"
          value={filters.role || ''}
          onChange={(e) => setFilters({ ...filters, role: e.target.value as any, page: 1 })}
          options={[
            { value: '', label: 'All Roles' },
            { value: 'employee', label: 'Employee' },
            { value: 'agent', label: 'Agent' },
            { value: 'supervisor', label: 'Supervisor' },
            { value: 'admin', label: 'Admin' },
          ]}
        />
        <Select
          className="max-w-[200px]"
          value={filters.department || ''}
          onChange={(e) => setFilters({ ...filters, department: e.target.value as any, page: 1 })}
          options={[
            { value: '', label: 'All Departments' },
            { value: 'IT', label: 'IT' },
            { value: 'HR', label: 'HR' },
            { value: 'General', label: 'General' },
          ]}
        />
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load roster" />}

      {isLoading ? (
        <SkeletonLoader type="text" count={10} />
      ) : data?.data.length === 0 ? (
        <div className="p-12 text-center border border-[var(--color-border)]">
          <Users className="mx-auto mb-4 h-8 w-8 text-[var(--color-muted)] opacity-50" />
          <p className="text-[var(--color-muted)]">No operatives found matching parameters.</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <UserTable 
            users={data?.data || []} 
            onEdit={openEditModal} 
            onDeactivate={setDeactivatingUser} 
          />
          {data?.meta && data.meta.total > data.meta.pageSize && (
            <Pagination
              page={data.meta.page}
              pageSize={data.meta.pageSize}
              total={data.meta.total}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Provision New Access">
        {createUserMutation.isError && <ErrorMessage error={createUserMutation.error} className="mb-4" />}
        <form onSubmit={handleCreateSubmit(onCreate)} className="space-y-4">
          <Input label="Name" {...registerCreate('name')} error={createErrors.name?.message} required />
          <Input label="Email" type="email" {...registerCreate('email')} error={createErrors.email?.message} required />
          <Input label="Initial Password" type="password" {...registerCreate('password')} error={createErrors.password?.message} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" {...registerCreate('role')} error={createErrors.role?.message} required options={[
              { value: 'employee', label: 'Employee' },
              { value: 'agent', label: 'Agent' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'admin', label: 'Admin' },
            ]} />
            <Select label="Department" {...registerCreate('department')} error={createErrors.department?.message} required options={[
              { value: 'IT', label: 'IT' },
              { value: 'HR', label: 'HR' },
              { value: 'General', label: 'General' },
            ]} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" tactical isLoading={createUserMutation.isPending}>Provision User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit ${editingUser?.name}`}>
        {updateUserMutation.isError && <ErrorMessage error={updateUserMutation.error} className="mb-4" />}
        <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4">
          <Input label="Name" {...registerEdit('name')} error={editErrors.name?.message} />
          <Input label="Email" type="email" {...registerEdit('email')} error={editErrors.email?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" {...registerEdit('role')} error={editErrors.role?.message} options={[
              { value: 'employee', label: 'Employee' },
              { value: 'agent', label: 'Agent' },
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'admin', label: 'Admin' },
            ]} />
            <Select label="Department" {...registerEdit('department')} error={editErrors.department?.message} options={[
              { value: 'IT', label: 'IT' },
              { value: 'HR', label: 'HR' },
              { value: 'General', label: 'General' },
            ]} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
            <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" tactical isLoading={updateUserMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onConfirm={onDeactivate}
        title="Revoke Access"
        description={`Are you sure you want to deactivate ${deactivatingUser?.name}? Their access will be immediately revoked, but their historical data will be preserved.`}
        confirmText="Revoke Access"
        isDestructive
        isLoading={deactivateUserMutation.isPending}
      />
    </div>
  )
}
