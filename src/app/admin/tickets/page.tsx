'use client';
import { useState } from 'react';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Search, AlertTriangle } from 'lucide-react';

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  ...['Open','Under Review','Assigned','Technician Visit Scheduled','In Progress',
      'Part Required','On Hold','Resolved','Customer Confirmation Pending','Closed','Reopened']
    .map(s => ({ value: s, label: s })),
];
const PRIORITY_OPTS = [
  { value: '', label: 'All Priorities' },
  ...['low','medium','high','critical'].map(p => ({ value: p, label: p.charAt(0).toUpperCase()+p.slice(1) })),
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
      <h1 className="text-2xl font-bold text-primary-900">All Tickets</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            placeholder="Search ticket ID or description…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select options={STATUS_OPTS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-52" />
        <Select options={PRIORITY_OPTS} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="w-36" />
      </div>

      {isLoading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-left">
                  <tr>
                    {['Ticket ID','Customer','Org','Category','Priority','Status','Technician','Deadline','Created'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tickets.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-slate-400">No tickets found</td></tr>
                  ) : tickets.map((t) => {
                    const customer = typeof t.customerId === 'object' ? t.customerId : null;
                    const tech = typeof t.assignedTechnician === 'object' ? t.assignedTechnician : null;

                    // Calculate remaining time or overdue status
                    let deadlineText = '—';
                    let isLate = false;
                    if (t.resolutionDeadline && t.status !== 'Resolved' && t.status !== 'Closed') {
                      const diffMs = new Date(t.resolutionDeadline).getTime() - Date.now();
                      isLate = diffMs < 0;
                      const absMs = Math.abs(diffMs);
                      const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      deadlineText = isLate ? `${days}d ${hours}h overdue` : `${days}d ${hours}h left`;
                    } else if (t.resolutionDeadline) {
                      deadlineText = formatDate(t.resolutionDeadline);
                    }

                    return (
                      <tr key={t._id} className={`hover:bg-slate-50 ${t.isOverdue || isLate ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <Link href={`/admin/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
                            {t.ticketId}
                          </Link>
                          {(t.isOverdue || isLate) && (
                            <span className="ml-1 inline-flex items-center">
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-800">{customer?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{customer?.organizationName || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{t.issueCategory}</td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3 text-xs text-slate-600">{tech?.name || '—'}</td>
                        <td className={`px-4 py-3 text-xs whitespace-nowrap font-medium ${isLate ? 'text-red-600' : 'text-slate-600'}`}>
                          {deadlineText}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{data?.total || 0} total tickets</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
              <span className="text-sm text-slate-600 px-2">Page {page} / {data?.pages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
