'use client';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Wrench, Clock, CheckCircle } from 'lucide-react';

export default function TechnicianDashboard() {
  const { data: assigned, isLoading } = useGetTicketsQuery({ status: 'Assigned', limit: 5 });
  const { data: inProgress } = useGetTicketsQuery({ status: 'In Progress', limit: 5 });
  const { data: resolved } = useGetTicketsQuery({ status: 'Resolved', limit: 5 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Assigned', value: assigned?.total || 0, icon: Wrench, color: 'text-blue-600 bg-blue-50' },
          { label: 'In Progress', value: inProgress?.total || 0, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Resolved', value: resolved?.total || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}><Icon className="w-6 h-6" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assigned Tickets</h2>
          <Link href="/technician/tickets" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-gray-100">
                  {['Ticket ID','Category','Priority','Status','Customer','Created'].map((h) => (
                    <th key={h} className="pb-3 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(assigned?.tickets || []).map((t) => {
                  const customer = typeof t.customerId === 'object' ? t.customerId : null;
                  return (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <Link href={`/technician/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">{t.ticketId}</Link>
                      </td>
                      <td className="py-3 text-xs text-gray-600">{t.issueCategory}</td>
                      <td className="py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="py-3"><StatusBadge status={t.status} /></td>
                      <td className="py-3 text-xs text-gray-600">{customer?.name || '—'}</td>
                      <td className="py-3 text-xs text-gray-500">{formatDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
