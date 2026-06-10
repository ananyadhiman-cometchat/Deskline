import { api } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Ticket,
  ApiListResponse,
  ApiSingleResponse,
  TicketFilters,
  CreateTicketPayload,
  UpdateTicketPayload,
} from '@/types'

// ============================================================
// Ticket Hooks
// ============================================================

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async (): Promise<ApiListResponse<Ticket>> => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.subType) params.set('subType', filters.subType)
      if (filters.category) params.set('category', filters.category)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

      const { data } = await api.get<ApiListResponse<Ticket>>(`/api/tickets?${params}`)
      return data
    },
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: async (): Promise<Ticket> => {
      const { data } = await api.get<ApiSingleResponse<Ticket>>(`/api/tickets/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>('/api/tickets', payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateTicketPayload) => {
      const { data } = await api.patch<ApiSingleResponse<Ticket>>(`/api/tickets/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useEscalateTicket(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>(`/api/tickets/${id}/escalate`)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
