import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { TicketFilters as Filters } from '@/types'

interface TicketFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  showAgentFilters?: boolean
}

export function TicketFilters({ filters, onChange, showAgentFilters = false }: TicketFiltersProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 })
  }

  const clearFilters = () => {
    onChange({ page: 1 })
  }

  const activeFilterCount = Object.keys(filters).filter(k => k !== 'page' && k !== 'pageSize' && filters[k as keyof Filters]).length

  return (
    <div className="mb-6 flex flex-col gap-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'escalated', label: 'Escalated' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </div>
      <div className="flex-1">
        <Select
          label="Type"
          value={filters.subType || ''}
          onChange={(e) => handleChange('subType', e.target.value)}
          options={[
            { value: '', label: 'All Types' },
            { value: 'information', label: 'Information' },
            { value: 'action', label: 'Action' },
            { value: 'conversation', label: 'Conversation' },
            { value: 'escalation', label: 'Escalation' },
          ]}
        />
      </div>
      
      {showAgentFilters && (
        <div className="flex-1">
          <Select
            label="Category"
            value={filters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'IT', label: 'IT' },
              { value: 'HR', label: 'HR' },
              { value: 'General', label: 'General' },
            ]}
          />
        </div>
      )}

      {activeFilterCount > 0 && (
        <div>
          <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
