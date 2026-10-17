import { apiSlice } from '../apiSlice';

export interface ClientItem {
  _id: string;
  adminId?: {
    _id: string;
    name: string;
    email: string;
  };
  clientName: string;
  clientEmail: string;
  clientMobile: string;
  address: string;
  date: string;
  panelInfo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  clientName: string;
  clientEmail: string;
  clientMobile: string;
  address: string;
  date: string;
  panelInfo?: string;
}

export const clientsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getClients: builder.query<{ success: boolean; count: number; data: ClientItem[] }, { search?: string } | void>({
      query: (params) => ({
        url: '/clients',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Client' as const, id: _id })), { type: 'Client', id: 'LIST' }]
          : [{ type: 'Client', id: 'LIST' }],
    }),
    getClient: builder.query<{ success: boolean; data: ClientItem }, string>({
      query: (id) => `/clients/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation<{ success: boolean; message: string; data: ClientItem }, CreateClientPayload>({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
    updateClient: builder.mutation<{ success: boolean; message: string; data: ClientItem }, { id: string } & Partial<CreateClientPayload>>({
      query: ({ id, ...body }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Client', id },
        { type: 'Client', id: 'LIST' },
      ],
    }),
    deleteClient: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Client', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;
