'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Ticket, Users, BarChart3, Settings,
  ClipboardList, Wrench, Shield, LogOut, Menu, X,
  PlusSquare, FileText,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '@/features/ui/uiSlice';
import { RootState } from '@/store/store';
import { clearCredentials } from '@/features/auth/authSlice';
import { useRouter } from 'next/navigation';
import { useLogoutMutation } from '@/store/api/authApi';
import Image from 'next/image';

const NAV_ITEMS = {
  customer: [
    { label: 'Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Tickets', href: '/customer/tickets', icon: Ticket },
    { label: 'Raise Ticket', href: '/customer/tickets/new', icon: PlusSquare },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Tickets', href: '/admin/tickets', icon: Ticket },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Users', href: '/admin/users', icon: Users },
  ],
  technician: [
    { label: 'Dashboard', href: '/technician/dashboard', icon: LayoutDashboard },
    { label: 'My Tickets', href: '/technician/tickets', icon: Wrench },
  ],
  superadmin: [
    { label: 'Overview', href: '/superadmin/dashboard', icon: Shield },
    { label: 'All Tickets', href: '/superadmin/tickets', icon: Ticket },
    { label: 'Users', href: '/superadmin/users', icon: Users },
    { label: 'Reports', href: '/superadmin/reports', icon: BarChart3 },
    { label: 'Audit Logs', href: '/superadmin/audit', icon: FileText },
    { label: 'Configuration', href: '/superadmin/config', icon: Settings },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer Portal',
  admin: 'Admin Panel',
  technician: 'Technician Panel',
  superadmin: 'Super Admin',
};

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const open = useSelector((s: RootState) => s.ui.sidebarOpen);
  const [logout] = useLogoutMutation();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role as keyof typeof NAV_ITEMS] || [];

  const handleLogout = async () => {
    await logout();
    dispatch(clearCredentials());
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out',
          'bg-primary-900',
          open ? 'w-64' : 'w-0 overflow-hidden lg:w-16'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-4 border-b border-primary-700/50 min-h-[64px]',
          !open && 'lg:justify-center lg:px-2'
        )}>
          {/* Logo mark - graduation cap placeholder matching brand */}
          <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0 font-bold text-primary-900 text-sm select-none">
            SA
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">Student Alliance</p>
              <p className="text-gold-400 text-xs font-medium truncate">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={cn('ml-auto text-primary-300 hover:text-white p-1 rounded', !open && 'hidden')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary-700 text-gold-400 border-l-2 border-gold-500'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white',
                  !open && 'lg:justify-center lg:px-2'
                )}
                title={!open ? item.label : undefined}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={cn('border-t border-primary-700/50 p-3', !open && 'lg:px-2')}>
          {open ? (
            <>
              <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1 rounded-lg bg-primary-800/50">
                <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-primary-900 font-bold text-xs flex-shrink-0">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-primary-300 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-300 hover:text-red-400 hover:bg-primary-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="flex justify-center w-full py-2 text-primary-300 hover:text-red-400 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
