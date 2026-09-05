import { apiSlice } from '../apiSlice';

export interface TrainingAcknowledgmentItem {
  _id: string;
  technicianId: {
    _id: string;
    name: string;
    email: string;
    mobileNumber?: string;
  };
  clientName: string;
  institutionName: string;
  trainingDate?: string;
  trainersPresentCount?: number;
  traineeNames?: string;
  clientEmail: string;
  signatureImage: string;
  trainingImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcknowledgmentPayload {
  clientName: string;
  institutionName: string;
  trainingDate?: string;
  trainersPresentCount?: number;
  traineeNames?: string;
  clientEmail: string;
  signatureImage: string;
  trainingImage: string;
}

export const acknowledgmentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAcknowledgments: builder.query<{ success: boolean; count: number; data: TrainingAcknowledgmentItem[] }, { search?: string } | void>({
      query: (params) => ({ url: '/acknowledgments', params: params || undefined }),
      providesTags: ['Acknowledgment'],
    }),
    getAcknowledgment: builder.query<{ success: boolean; data: TrainingAcknowledgmentItem }, string>({
      query: (id) => `/acknowledgments/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Acknowledgment', id }],
    }),
    createAcknowledgment: builder.mutation<{ success: boolean; data: TrainingAcknowledgmentItem }, CreateAcknowledgmentPayload>({
      query: (body) => ({
        url: '/acknowledgments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Acknowledgment'],
    }),
    updateAcknowledgmentDate: builder.mutation<{ success: boolean; data: TrainingAcknowledgmentItem }, { id: string; trainingDate: string }>({
      query: ({ id, trainingDate }) => ({
        url: `/acknowledgments/${id}/date`,
        method: 'PATCH',
        body: { trainingDate },
      }),
      invalidatesTags: ['Acknowledgment'],
    }),
  }),
});

export const {
  useGetAcknowledgmentsQuery,
  useGetAcknowledgmentQuery,
  useCreateAcknowledgmentMutation,
  useUpdateAcknowledgmentDateMutation,
} = acknowledgmentsApi;
