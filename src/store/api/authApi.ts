import { apiSlice } from '../apiSlice';
import { User } from '../../types';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<{ success: boolean; data: { customerId: string; email: string } }, unknown>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<{ success: boolean; data: { accessToken: string; user: User } }, { identifier: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    googleLogin: builder.mutation<{ success: boolean; data: { accessToken: string; user: User } }, { credential: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
    }),
    completeProfile: builder.mutation<{ success: boolean; data: User }, { password?: string; mobileNumber?: string; organizationName?: string; city?: string; state?: string; address?: string; panels?: { serialNumber: string; size: string; installationDate: string }[] }>({
      query: (body) => ({ url: '/auth/complete-profile', method: 'POST', body }),
    }),
    requestOTP: builder.mutation<{ success: boolean; message: string }, { identifier: string }>({
      query: (body) => ({ url: '/auth/otp/request', method: 'POST', body }),
    }),
    verifyOTP: builder.mutation<{ success: boolean; data: { accessToken: string; user: User } }, { identifier: string; code: string }>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
    }),
    refreshToken: builder.mutation<{ success: boolean; data: { accessToken: string } }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<{ success: boolean; data: User }, void>({
      query: () => '/auth/me',
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useCompleteProfileMutation,
  useRequestOTPMutation,
  useVerifyOTPMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
