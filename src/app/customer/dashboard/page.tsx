'use client';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Ticket, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetTicketsQuery({ limit: 5 });

  const tickets = data?.tickets || [];
  const stats = {
    total: data?.total || 0,
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.organizationName || 'IFPD Support Dashboard'}</p>
        </div>
        <Link href="/customer/tickets/new">
          <Button><Plus className="w-4 h-4" /> Raise Ticket</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: stats.total, icon: Ticket, color: 'text-blue-600 bg-blue-50' },
          { label: 'Open', value: stats.open, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}><Icon className="w-6 h-6" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <Link href="/customer/tickets" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {isLoading ? (
          <Spinner className="py-8" />
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tickets yet</p>
            <Link href="/customer/tickets/new">
              <Button className="mt-4" size="sm"><Plus className="w-4 h-4" /> Raise Your First Ticket</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-500">Ticket ID</th>
                  <th className="pb-3 font-medium text-gray-500">Category</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Created</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs font-medium text-gray-900">{t.ticketId}</td>
                    <td className="py-3 text-gray-600">{t.issueCategory}</td>
                    <td className="py-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                    <td className="py-3">
                      <Link href={`/customer/tickets/${t.ticketId}`} className="text-primary-600 hover:underline text-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
