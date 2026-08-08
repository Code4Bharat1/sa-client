import { apiSlice } from '../apiSlice';
import { TicketStatus, Priority } from '@/types';

export interface ChatMessage {
  _id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'customer' | 'admin' | 'technician';
  senderName: string;
  message: string;
  attachments?: string[];
  replyTo?: {
    messageId: string;
    senderName: string;
    senderRole: 'customer' | 'admin' | 'technician';
    message: string;
  };
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatThread {
  ticketId: string;
  ticket?: {
    _id: string;
    ticketId: string;
    panelSerialNumber: string;
    issueCategory: string;
    status: TicketStatus;
    priority: Priority;
    createdAt: string;
    customerId?: {
      name: string;
      email: string;
      mobileNumber?: string;
    };
  };
  lastMessage: string;
  lastSenderRole: string;
  lastSenderName: string;
  updatedAt: string;
  unreadCount: number;
}

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTicketMessages: builder.query<{ success: boolean; data: ChatMessage[] }, string>({
      query: (ticketId) => `/messages/${ticketId}`,
      providesTags: (result, error, ticketId) => [{ type: 'Ticket', id: ticketId }],
    }),
    sendMessage: builder.mutation<
      { success: boolean; data: ChatMessage },
      {
        ticketId: string;
        message: string;
        attachments?: string[];
        replyTo?: {
          messageId: string;
          senderName: string;
          senderRole: 'customer' | 'admin' | 'technician';
          message: string;
        };
      }
    >({
      query: ({ ticketId, message, attachments, replyTo }) => ({
        url: `/messages/${ticketId}`,
        method: 'POST',
        body: { message, attachments, replyTo },
      }),
    }),
    getAdminChatThreads: builder.query<{ success: boolean; data: AdminChatThread[] }, void>({
      query: () => '/messages/admin/threads',
      providesTags: ['Ticket'],
    }),
  }),
});

export const {
  useGetTicketMessagesQuery,
  useSendMessageMutation,
  useGetAdminChatThreadsQuery,
  useLazyGetAdminChatThreadsQuery,
} = messagesApi;
