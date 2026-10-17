'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRefreshTokenMutation, useLazyGetMeQuery } from '@/store/api/authApi';
import { setCredentials, clearCredentials, setAccessToken } from '@/features/auth/authSlice';
import { RootState } from '@/store/store';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const isInitialized = useSelector((s: RootState) => s.auth.isInitialized);
  const [refreshToken] = useRefreshTokenMutation();
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const refreshResult = await refreshToken().unwrap();
        if (refreshResult?.success && refreshResult?.data?.accessToken) {
          const accessToken = refreshResult.data.accessToken;
          // Set access token in store so prepareHeaders includes it in the getMe request
          dispatch(setAccessToken(accessToken));
          
          const userResult = await getMe().unwrap();
          if (userResult?.success && userResult?.data) {
            dispatch(
              setCredentials({
                user: userResult.data,
                accessToken,
              })
            );
          } else {
            dispatch(clearCredentials());
          }
        } else {
          dispatch(clearCredentials());
        }
      } catch (err) {
        dispatch(clearCredentials());
      }
    };

    if (!isInitialized) {
      initializeAuth();
    }
  }, [dispatch, isInitialized, refreshToken, getMe]);

  return <>{children}</>;
}
