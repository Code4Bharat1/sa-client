import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { RootState } from './store';
import { setAccessToken, clearCredentials } from '../features/auth/authSlice';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If 401 Unauthorized, automatically attempt to refresh access token using the HTTP-only refresh cookie
  if (result.error && result.error.status === 401) {
    // Avoid infinite loop if the failed request was the refresh endpoint itself
    const isRefreshCall = typeof args === 'object' && 'url' in args && args.url === '/auth/refresh';
    if (!isRefreshCall) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { success: boolean; data: { accessToken: string } };
        if (data?.data?.accessToken) {
          api.dispatch(setAccessToken(data.data.accessToken));
          // Retry the initial failed request with the new access token
          result = await rawBaseQuery(args, api, extraOptions);
        }
      } else {
        api.dispatch(clearCredentials());
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Ticket', 'User', 'KPI', 'Report', 'Acknowledgment', 'Delivery', 'Inventory'],
  endpoints: () => ({}),
});
