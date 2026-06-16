'use client';
import { useState } from 'react';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const STATUS_OPTS = [
  { value: '', label: 'All' },
  ...['Assigned','Technician Visit Scheduled','In Progress','Part Required','On Hold','Resolved'].map(s => ({ value: s, label: s })),
];

export default function TechnicianTicketsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetTicketsQuery({ status, page, limit: 25 });
  const tickets = data?.tickets || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Assigned Tickets</h1>

      <Select options={STATUS_OPTS} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-56" />

      {isLoading ? <Spinner className="py-16" /> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {['Ticket ID','Customer','Category','Priority','Status','Created','Action'].map(h => (
                    <th key={h} className="px-4 py-3 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">No tickets</td></tr>
                ) : tickets.map(t => {
                  const customer = typeof t.customerId === 'object' ? t.customerId : null;
                  return (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{t.ticketId}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{customer?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{t.issueCategory}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/technician/tickets/${t.ticketId}`} className="text-primary-600 hover:underline font-medium text-xs">Update</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
