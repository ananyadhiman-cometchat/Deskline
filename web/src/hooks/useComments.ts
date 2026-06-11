import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TicketComment, ApiSingleResponse } from '@/types';

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId, 'comments'],
    queryFn: async (): Promise<TicketComment[]> => {
      const { data } = await api.get<{ data: TicketComment[] }>(`/api/tickets/${ticketId}/comments`);
      return data.data;
    },
    enabled: !!ticketId,
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<ApiSingleResponse<TicketComment>>(`/api/tickets/${ticketId}/comments`, { body });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticketId] }); // invalidate ticket to update lastActivityAt
    },
  });
}
