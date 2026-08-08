'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { useSSE } from '@/hooks/useSSE';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthInitializer } from '@/components/shared/AuthInitializer';
import { SocketProvider } from '@/context/SocketContext';

function SSEConnector() {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  useSSE(token);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Provider store={store}>
        <AuthInitializer>
          <SocketProvider>
            <SSEConnector />
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            {children}
          </SocketProvider>
        </AuthInitializer>
      </Provider>
    </GoogleOAuthProvider>
  );
}
