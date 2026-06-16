'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetTicketQuery, useUpdateTicketStatusMutation, useSubmitResolutionMutation } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, StatusHistory } from '@/types';

const TECH_TRANSITIONS: Record<string, string[]> = {
  'Assigned': ['Technician Visit Scheduled', 'In Progress'],
  'Technician Visit Scheduled': ['In Progress'],
  'In Progress': ['Part Required', 'Resolved', 'On Hold'],
  'Part Required': ['In Progress', 'On Hold'],
  'On Hold': ['In Progress'],
};

export default function TechnicianTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading, refetch } = useGetTicketQuery(ticketId);
  const ticket = data?.data;

  const [updateStatus, { isLoading: statusLoading }] = useUpdateTicketStatusMutation();
  const [submitResolution, { isLoading: resLoading }] = useSubmitResolutionMutation();

  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [resRemarks, setResRemarks] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-gray-500 py-16">Ticket not found</div>;

  const customer = typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const allowedNext = TECH_TRANSITIONS[ticket.status] || [];

  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error('Select a status'); return; }
    try {
      await updateStatus({ ticketId, status: newStatus, remarks }).unwrap();
      toast.success('Status updated');
      setNewStatus(''); setRemarks('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  const handleResolution = async () => {
    if (!workPerformed.trim()) { toast.error('Work performed is required'); return; }
    try {
      await submitResolution({
        ticketId,
        workPerformed,
        partsUsed: partsUsed ? partsUsed.split(',').map(p => p.trim()).filter(Boolean) : [],
        remarks: resRemarks,
      }).unwrap();
      toast.success('Resolution submitted! Ticket marked as Resolved.');
      setShowResolutionForm(false);
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-gray-900">{ticket.ticketId}</h1>
          <p className="text-sm text-gray-500 mt-1">{ticket.issueCategory}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <Card>
        <CardTitle className="mb-3">Customer & Panel Info</CardTitle>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-gray-500">Customer</dt><dd className="font-medium">{customer?.name || '—'}</dd></div>
          <div><dt className="text-gray-500">Mobile</dt><dd>{customer?.mobileNumber || '—'}</dd></div>
          <div><dt className="text-gray-500">Organization</dt><dd>{customer?.organizationName || '—'}</dd></div>
          <div><dt className="text-gray-500">Panel Serial</dt><dd className="font-mono">{ticket.panelSerialNumber}</dd></div>
          <div><dt className="text-gray-500">Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
          <div><dt className="text-gray-500">Expected Response</dt><dd className={ticket.isOverdue ? 'text-red-600 font-medium' : ''}>{formatDate(ticket.expectedResponseTime)}</dd></div>
        </dl>
        <div className="mt-3">
          <dt className="text-sm text-gray-500 mb-1">Issue Description</dt>
          <dd className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{ticket.description}</dd>
        </div>
      </Card>

      {allowedNext.length > 0 && !showResolutionForm && (
        <Card>
          <CardTitle className="mb-3">Update Status</CardTitle>
          <div className="space-y-3">
            <Select
              options={allowedNext.map(s => ({ value: s, label: s }))}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="Select next status"
            />
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
              placeholder="Remarks (optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleStatusUpdate} loading={statusLoading} disabled={!newStatus}>Update Status</Button>
              {['In Progress', 'Part Required'].includes(ticket.status) && (
                <Button variant="secondary" onClick={() => setShowResolutionForm(true)}>Submit Resolution</Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {(showResolutionForm || ticket.status === 'In Progress') && !ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Submit Resolution</CardTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Performed *</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={4}
                placeholder="Describe the work performed..."
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parts Used (comma-separated)</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Touch panel, HDMI cable"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={2}
                placeholder="Additional remarks..."
                value={resRemarks}
                onChange={(e) => setResRemarks(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button loading={resLoading} onClick={handleResolution}>Mark as Resolved</Button>
              <Button variant="ghost" onClick={() => setShowResolutionForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Resolution Submitted</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Work</dt><dd>{ticket.resolution.workPerformed}</dd></div>
            <div><dt className="text-gray-500">Parts</dt><dd>{ticket.resolution.partsUsed?.join(', ') || '—'}</dd></div>
            <div><dt className="text-gray-500">Resolved At</dt><dd>{formatDate(ticket.resolution.resolvedAt)}</dd></div>
          </dl>
        </Card>
      )}

      <Card>
        <CardTitle className="mb-3">Timeline</CardTitle>
        <ol className="relative border-l border-gray-200 space-y-4 ml-2">
          {ticket.statusHistory.map((h: StatusHistory, i) => (
            <li key={i} className="ml-4">
              <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
              <div className="flex items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
              </div>
              {h.remarks && <p className="text-xs text-gray-500 mt-1">{h.remarks}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
