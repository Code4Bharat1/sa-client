import { apiSlice } from '../apiSlice';
import { PanelInventory } from '@/types';

export interface InventoryQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface InventoryListResponse {
  success: boolean;
  data: {
    items: PanelInventory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalVendors?: number;
    totalCustomers?: number;
  };
}

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query<InventoryListResponse, InventoryQueryParams | void>({
      query: (params) => ({
        url: '/inventory',
        params: params || {},
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Inventory' as const, id: _id })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    getInventoryItem: builder.query<{ success: boolean; data: PanelInventory }, string>({
      query: (id) => `/inventory/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Inventory', id }],
    }),

    createInventory: builder.mutation<{ success: boolean; data: PanelInventory }, Partial<PanelInventory>>({
      query: (body) => ({
        url: '/inventory',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),

    updateInventory: builder.mutation<
      { success: boolean; data: PanelInventory },
      { id: string } & Partial<PanelInventory>
    >({
      query: ({ id, ...body }) => ({
        url: `/inventory/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    deleteInventory: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useGetInventoryItemQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} = inventoryApi;
