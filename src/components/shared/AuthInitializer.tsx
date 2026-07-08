'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRefreshTokenMutation, useLazyGetMeQuery } from '@/store/api/authApi';
import { setCredentials, clearCredentials, setAccessToken } from '@/features/auth/authSlice';
import { RootState } from '@/store/store';
import { Loader2 } from 'lucide-react';

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

  if (!isInitialized) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 gap-3 z-50">
        <Loader2 className="w-10 h-10 text-primary-700 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Restoring session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
