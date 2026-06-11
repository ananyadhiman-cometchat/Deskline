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
import { useUIStore } from '@/store/uiStore'
import { getApiErrorMessage } from '@/lib/api'

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
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>('/api/tickets', payload)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Ticket Created', message: 'Your ticket has been submitted.' })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Ticket Creation Failed', message: getApiErrorMessage(error) })
  })
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async (payload: UpdateTicketPayload) => {
      const { data } = await api.patch<ApiSingleResponse<Ticket>>(`/api/tickets/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Ticket Updated', message: 'Changes saved successfully.' })
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Update Failed', message: getApiErrorMessage(error) })
  })
}

export function useEscalateTicket(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>(`/api/tickets/${id}/escalate`)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Ticket Escalated', message: 'Ticket moved to supervisor queue.' })
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useRequestHumanHelp(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>(`/api/tickets/${id}/request-human-help`)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Human Help Requested', message: 'The ticket has been routed for human assistance.' })
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Request Failed', message: getApiErrorMessage(error) })
  })
}

export function useConfirmResolution(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>(`/api/tickets/${id}/confirm-resolution`)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Resolution Confirmed', message: 'The ticket has been closed successfully.' })
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Confirmation Failed', message: getApiErrorMessage(error) })
  })
}

export function useRejectResolution(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiSingleResponse<Ticket>>(`/api/tickets/${id}/reject-resolution`)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'warning', title: 'Resolution Rejected', message: 'The ticket has been reopened for further work.' })
      void qc.invalidateQueries({ queryKey: ['tickets', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Rejection Failed', message: getApiErrorMessage(error) })
  })
}
