'use client';
import { Sidebar } from '@/components/shared/Sidebar';
import { Topbar } from '@/components/shared/Topbar';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const open = useSelector((s: RootState) => s.ui.sidebarOpen);
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (user?.profileComplete === false) { router.replace('/complete-profile'); return; }
    if (user?.role !== 'admin') router.replace('/login');
  }, [isInitialized, isAuthenticated, user, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className={cn('flex-1 flex flex-col overflow-hidden transition-all duration-300', open ? 'ml-64' : 'ml-0 lg:ml-16')}>
        <Topbar title="Admin Panel" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
