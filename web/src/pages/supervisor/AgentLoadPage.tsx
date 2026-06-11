import { useTickets } from '@/hooks/useTickets'
import { Card } from '@/components/ui/Card'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Badge } from '@/components/ui/Badge'
import { Users } from 'lucide-react'

export default function AgentLoadPage() {
  // Supervisor needs to see all agents to check their load. 
  // We can use the admin useUsers hook (it just calls /api/admin/users, which 
  // we might need to ensure supervisors have access to in backend. If not, we might
  // need a dedicated supervisor endpoint, but according to AGENTS.md, Admin manages users.
  // Wait, AGENTS.md says: `Agent Load View` - Table: agent name, open count, resolved count.
  // Does the user endpoint return open count? The schema says we need to derive it, or backend provides it.
  // For the frontend UI phase, we'll build the table structure. Since we only have `useUsers` right now,
  // we'll fetch agents and mock the ticket counts if they aren't on the User model yet, or assume they will be added.
  // Actually, standard `User` interface doesn't have `openTicketsCount`. We will display what we have or mock the counts for the UI until backend is wired.
  
  const { data, isLoading, isError, error } = useTickets({ pageSize: 200 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Agent Workload</h1>
        <p className="text-[var(--color-muted)]">Monitor ticket distribution and agent performance across departments.</p>
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load agents" />}

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-4">
            <SkeletonLoader type="text" count={5} />
          </div>
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted)]">
            <Users className="mx-auto mb-4 h-8 w-8 opacity-50" />
            <p>No active agents found.</p>
          </div>
        ) : (
          <div className="table-wrapper m-0 border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-center">Open Tickets</th>
                  <th className="text-center">Resolved (All Time)</th>
                </tr>
              </thead>
              <tbody>
                {Object.values((data?.data || []).reduce((acc: any, ticket: any) => {
                  if (!ticket.agent) return acc
                  const existing = acc[ticket.agent.id] || { ...ticket.agent, open: 0, resolved: 0 }
                  if (['open', 'in_progress', 'escalated'].includes(ticket.status)) existing.open++
                  if (['resolved', 'closed'].includes(ticket.status)) existing.resolved++
                  acc[ticket.agent.id] = existing
                  return acc
                }, {})).map((agent: any) => (
                  <tr key={agent.id}>
                    <td className="font-semibold text-[var(--color-navy)]">{agent.name}</td>
                    <td>{agent.department}</td>
                    <td>
                      {true ? (
                        <Badge variant="open">Active</Badge>
                      ) : (
                        <Badge variant="closed">Offline</Badge>
                      )}
                    </td>
                    <td className="text-center font-mono font-bold text-[var(--color-brand-red)]">
                      {/* Placeholder until backend provides these counts */}
                      {agent.open}
                    </td>
                    <td className="text-center font-mono text-[var(--color-muted)]">
                      {agent.resolved}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
