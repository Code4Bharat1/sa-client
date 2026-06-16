'use client';
import { useParams } from 'next/navigation';
import { useGetTicketQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { User, StatusHistory } from '@/types';
import { Shield } from 'lucide-react';

export default function SuperAdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading } = useGetTicketQuery(ticketId);
  const ticket = data?.data;

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-slate-500 py-16">Ticket not found</div>;

  const customer = typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const tech = typeof ticket.assignedTechnician === 'object' ? (ticket.assignedTechnician as User) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-gold-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Super Admin View</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-900 font-mono">{ticket.ticketId}</h1>
          <p className="text-sm text-slate-500 mt-1">{ticket.issueCategory} · {ticket.panelSerialNumber}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          {ticket.isOverdue && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">OVERDUE</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-3">Customer</CardTitle>
          {customer ? (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-primary-900">{customer.name}</dd></div>
              <div><dt className="text-slate-500">Customer ID</dt><dd className="font-mono text-xs">{customer.customerId}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd>{customer.email}</dd></div>
              <div><dt className="text-slate-500">Mobile</dt><dd>{customer.mobileNumber}</dd></div>
              <div><dt className="text-slate-500">Organization</dt><dd>{customer.organizationName || '—'}</dd></div>
            </dl>
          ) : <p className="text-sm text-slate-400">—</p>}
        </Card>

        <Card>
          <CardTitle className="mb-3">Ticket Details</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Description</dt><dd className="text-slate-800 bg-slate-50 rounded p-2 text-xs">{ticket.description}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            <div><dt className="text-slate-500">Expected Response</dt><dd className={ticket.isOverdue ? 'text-red-600 font-semibold' : ''}>{formatDate(ticket.expectedResponseTime)}</dd></div>
            <div><dt className="text-slate-500">Assigned Technician</dt><dd>{tech?.name || '—'}</dd></div>
            <div><dt className="text-slate-500">Reopen Count</dt><dd>{ticket.reopenStatus.reopenCount}</dd></div>
          </dl>
        </Card>
      </div>

      {ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Resolution</CardTitle>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Work Performed</dt><dd>{ticket.resolution.workPerformed}</dd></div>
            <div><dt className="text-slate-500">Parts Used</dt><dd>{ticket.resolution.partsUsed?.join(', ') || '—'}</dd></div>
            <div><dt className="text-slate-500">Resolved At</dt><dd>{formatDate(ticket.resolution.resolvedAt)}</dd></div>
            <div><dt className="text-slate-500">Closed At</dt><dd>{formatDate(ticket.closedAt)}</dd></div>
          </dl>
        </Card>
      )}

      {ticket.feedback && (
        <Card>
          <CardTitle className="mb-3">Customer Feedback</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className={`w-5 h-5 ${s <= ticket.feedback!.rating ? 'text-gold-400 fill-gold-400' : 'text-slate-200'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            <span className="text-sm font-semibold text-primary-900">{ticket.feedback.rating}/5</span>
          </div>
          {ticket.feedback.comment && <p className="mt-2 text-sm text-slate-600">{ticket.feedback.comment}</p>}
        </Card>
      )}

      <Card>
        <CardTitle className="mb-4">Full Status Timeline</CardTitle>
        <ol className="relative border-l-2 border-primary-100 space-y-5 ml-3">
          {ticket.statusHistory.map((h: StatusHistory, i) => (
            <li key={i} className="ml-5">
              <div className="absolute -left-[9px] mt-0.5 w-4 h-4 rounded-full bg-primary-800 border-2 border-white shadow-sm" />
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={h.status} />
                <span className="text-xs text-slate-400">{formatDate(h.timestamp)}</span>
                {typeof h.changedBy === 'object' && (
                  <span className="text-xs text-slate-500">— {(h.changedBy as { name: string; role: string }).name} ({(h.changedBy as { name: string; role: string }).role})</span>
                )}
              </div>
              {h.remarks && <p className="text-xs text-slate-500 mt-1 ml-0.5">{h.remarks}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
