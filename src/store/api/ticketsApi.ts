import { apiSlice } from '../apiSlice';
import { Ticket, PaginatedResponse } from '../../types';

interface TicketFilters {
  status?: string;
  priority?: string;
  issueCategory?: string;
  panelSerialNumber?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const ticketsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<PaginatedResponse<Ticket>, TicketFilters>({
      query: (params) => ({ url: '/tickets', params }),
      providesTags: ['Ticket'],
    }),
    getTicket: builder.query<{ success: boolean; data: Ticket }, string>({
      query: (ticketId) => `/tickets/${ticketId}`,
      providesTags: (_result, _err, id) => [{ type: 'Ticket', id }],
    }),
    createTicket: builder.mutation<{ success: boolean; data: Ticket }, unknown>({
      query: (body) => ({ url: '/tickets', method: 'POST', body }),
      invalidatesTags: ['Ticket'],
    }),
    updateTicketStatus: builder.mutation<{ success: boolean; data: Ticket }, { ticketId: string; status: string; remarks?: string }>({
      query: ({ ticketId, ...body }) => ({ url: `/tickets/${ticketId}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Ticket', 'KPI'],
    }),
    assignTicket: builder.mutation<{ success: boolean; data: Ticket }, { ticketId: string; assignedTechnician?: string; assignedTeam?: string }>({
      query: ({ ticketId, ...body }) => ({ url: `/tickets/${ticketId}/assign`, method: 'PATCH', body }),
      invalidatesTags: ['Ticket'],
    }),
    submitResolution: builder.mutation<{ success: boolean; data: Ticket }, { ticketId: string; workPerformed: string; partsUsed?: string[]; remarks?: string; customerSignature?: string }>({
      query: ({ ticketId, ...body }) => ({ url: `/tickets/${ticketId}/resolution`, method: 'PATCH', body }),
      invalidatesTags: ['Ticket'],
    }),
    confirmResolution: builder.mutation<{ success: boolean; data: Ticket }, string>({
      query: (ticketId) => ({ url: `/tickets/${ticketId}/confirm`, method: 'POST' }),
      invalidatesTags: ['Ticket', 'KPI'],
    }),
    reopenTicket: builder.mutation<{ success: boolean; data: Ticket }, { ticketId: string; reason: string }>({
      query: ({ ticketId, ...body }) => ({ url: `/tickets/${ticketId}/reopen`, method: 'POST', body }),
      invalidatesTags: ['Ticket'],
    }),
    submitFeedback: builder.mutation<{ success: boolean; data: Ticket }, { ticketId: string; rating: number; comment?: string }>({
      query: ({ ticketId, ...body }) => ({ url: `/tickets/${ticketId}/feedback`, method: 'POST', body }),
      invalidatesTags: ['Ticket'],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketStatusMutation,
  useAssignTicketMutation,
  useSubmitResolutionMutation,
  useConfirmResolutionMutation,
  useReopenTicketMutation,
  useSubmitFeedbackMutation,
} = ticketsApi;
