import { apiSlice } from '../apiSlice';

export type DeliveryStatus = 'Scheduled' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface DeliveryItem {
  _id: string;
  adminId: {
    _id: string;
    name: string;
    email: string;
  };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  googleMapLink?: string;
  productName: string;
  deliveryAgentName: string;
  deliveryAgentPhone: string;
  deliveryAgentEmail: string;
  deliveryDate: string;
  estimateTime: string;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  googleMapLink?: string;
  productName: string;
  deliveryAgentName: string;
  deliveryAgentPhone: string;
  deliveryAgentEmail: string;
  deliveryDate: string;
  estimateTime: string;
  status?: DeliveryStatus;
}

export const deliveriesApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDeliveries: builder.query<{ success: boolean; count: number; data: DeliveryItem[] }, { search?: string; status?: string } | void>({
      query: (params) => ({
        url: '/deliveries',
        params: params || undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Delivery' as const, id: _id })), { type: 'Delivery', id: 'LIST' }]
          : [{ type: 'Delivery', id: 'LIST' }],
    }),
    getDelivery: builder.query<{ success: boolean; data: DeliveryItem }, string>({
      query: (id) => `/deliveries/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Delivery', id }],
    }),
    createDelivery: builder.mutation<{ success: boolean; message: string; data: DeliveryItem }, CreateDeliveryPayload>({
      query: (body) => ({
        url: '/deliveries',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Delivery', id: 'LIST' }],
    }),
    updateDelivery: builder.mutation<{ success: boolean; message: string; data: DeliveryItem }, { id: string } & CreateDeliveryPayload>({
      query: ({ id, ...body }) => ({
        url: `/deliveries/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Delivery', id },
        { type: 'Delivery', id: 'LIST' },
      ],
    }),
    updateDeliveryStatus: builder.mutation<{ success: boolean; message: string; data: DeliveryItem }, { id: string; status: DeliveryStatus }>({
      query: ({ id, status }) => ({
        url: `/deliveries/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Delivery', id },
        { type: 'Delivery', id: 'LIST' },
      ],
    }),
    resendDeliveryWhatsApp: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/deliveries/${id}/resend-whatsapp`,
        method: 'POST',
      }),
    }),
    deleteDelivery: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/deliveries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Delivery', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDeliveriesQuery,
  useGetDeliveryQuery,
  useCreateDeliveryMutation,
  useUpdateDeliveryMutation,
  useUpdateDeliveryStatusMutation,
  useResendDeliveryWhatsAppMutation,
  useDeleteDeliveryMutation,
} = deliveriesApi;
