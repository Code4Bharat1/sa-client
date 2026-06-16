'use client';
import { useState } from 'react';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Search } from 'lucide-react';

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  ...['Open','Under Review','Assigned','Technician Visit Scheduled','In Progress','Part Required','On Hold','Resolved','Customer Confirmation Pending','Closed','Reopened'].map(s => ({ value: s, label: s })),
];
const PRIORITY_OPTS = [
  { value: '', label: 'All Priorities' },
  ...['low','medium','high','critical'].map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) })),
];

export default function AdminTicketsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetTicketsQuery({ search, status, priority, page, limit: 25 });
  const tickets = data?.tickets || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Search by ticket ID or description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select options={STATUS_OPTS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48" />
        <Select options={PRIORITY_OPTS} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="w-36" />
      </div>

      {isLoading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    {['Ticket ID','Customer','Category','Priority','Status','Technician','Created','Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">No tickets found</td></tr>
                  ) : tickets.map((t) => {
                    const customer = typeof t.customerId === 'object' ? t.customerId : null;
                    const tech = typeof t.assignedTechnician === 'object' ? t.assignedTechnician : null;
                    return (
                      <tr key={t._id} className={`hover:bg-gray-50 ${t.isOverdue ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{t.ticketId}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-medium text-gray-900">{customer?.name || '—'}</div>
                          <div className="text-gray-400">{customer?.organizationName || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{t.issueCategory}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-xs text-gray-600">{tech?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/tickets/${t.ticketId}`} className="text-primary-600 hover:underline font-medium text-xs">Manage</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total: {data?.total} tickets</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-600 px-2 py-1">Page {page} of {data?.pages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
