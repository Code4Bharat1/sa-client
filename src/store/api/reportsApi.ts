import { apiSlice } from '../apiSlice';
import { KPIs, User } from '../../types';

export const reportsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getKPIs: builder.query<{ success: boolean; data: KPIs }, void>({
      query: () => '/dashboard/kpis',
      providesTags: ['KPI'],
    }),
    getTechnicianPerformance: builder.query<{ success: boolean; data: unknown[] }, void>({
      query: () => '/reports/technician-performance',
    }),
    getTicketReport: builder.query<{ success: boolean; data: unknown[] }, Record<string, string>>({
      query: (params) => ({ url: '/reports/tickets', params }),
      providesTags: ['Report'],
    }),
    getAuditLogs: builder.query<{ success: boolean; data: unknown[]; total: number }, { entity?: string; page?: number }>({
      query: (params) => ({ url: '/reports/audit-logs', params }),
    }),
    listUsers: builder.query<{ success: boolean; data: User[]; total: number; pages?: number }, { role?: string; page?: number; search?: string }>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    listTechnicians: builder.query<{ success: boolean; data: User[] }, void>({
      query: () => '/users/technicians',
    }),
    createUser: builder.mutation<{ success: boolean; data: unknown }, unknown>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<{ success: boolean; data: User }, { id: string; [key: string]: unknown }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetKPIsQuery,
  useGetTechnicianPerformanceQuery,
  useGetTicketReportQuery,
  useGetAuditLogsQuery,
  useListUsersQuery,
  useListTechniciansQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} = reportsApi;
