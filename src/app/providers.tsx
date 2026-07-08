'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'react-hot-toast';
import { useSSE } from '@/hooks/useSSE';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

import { AuthInitializer } from '@/components/shared/AuthInitializer';

function SSEConnector() {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  useSSE(token);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <SSEConnector />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </AuthInitializer>
    </Provider>
  );
}
