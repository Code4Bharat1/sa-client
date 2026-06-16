'use client';
import { Bell, Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/features/ui/uiSlice';
import { markAllRead } from '@/features/notifications/notificationsSlice';
import { RootState } from '@/store/store';
import { useState, useRef, useEffect } from 'react';

export function Topbar({ title }: { title?: string }) {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications);
  const open = useSelector((s: RootState) => s.ui.sidebarOpen);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-20 shadow-sm">
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="p-2 rounded-lg text-gray-500 hover:bg-slate-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h2 className="text-base font-semibold text-primary-900">{title}</h2>
      </div>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => {
            setShowNotif((s) => !s);
            if (unreadCount > 0) dispatch(markAllRead());
          }}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-sm text-primary-900">Notifications</span>
              {items.length > 0 && (
                <button
                  onClick={() => dispatch(markAllRead())}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No notifications</p>
            ) : (
              items.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-50 last:border-0 text-sm transition-colors ${
                    n.read ? 'text-gray-500 bg-white' : 'text-gray-800 bg-primary-50 font-medium'
                  }`}
                >
                  <p className="leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  );
}
