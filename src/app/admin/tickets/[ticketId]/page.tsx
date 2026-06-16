'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useGetTicketQuery, useUpdateTicketStatusMutation, useAssignTicketMutation,
} from '@/store/api/ticketsApi';
import { useListTechniciansQuery } from '@/store/api/reportsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { StatusHistory, User } from '@/types';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Review', 'Assigned'],
  'Under Review': ['Assigned', 'On Hold'],
  'Assigned': ['Technician Visit Scheduled', 'In Progress', 'On Hold'],
  'Technician Visit Scheduled': ['In Progress', 'On Hold'],
  'In Progress': ['Part Required', 'Resolved', 'On Hold'],
  'Part Required': ['In Progress', 'On Hold'],
  'On Hold': ['In Progress', 'Assigned'],
  'Resolved': ['Customer Confirmation Pending'],
  'Reopened': ['Under Review', 'Assigned'],
};

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading, refetch } = useGetTicketQuery(ticketId);
  const ticket = data?.data;
  const { data: techData } = useListTechniciansQuery();
  const technicians = techData?.data || [];

  const [updateStatus, { isLoading: statusLoading }] = useUpdateTicketStatusMutation();
  const [assign, { isLoading: assignLoading }] = useAssignTicketMutation();

  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [techId, setTechId] = useState('');

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-gray-500 py-16">Ticket not found</div>;

  const customer = typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const tech = typeof ticket.assignedTechnician === 'object' ? (ticket.assignedTechnician as User) : null;

  const allowedNext = STATUS_TRANSITIONS[ticket.status] || [];

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

  const handleAssign = async () => {
    if (!techId) { toast.error('Select a technician'); return; }
    try {
      await assign({ ticketId, assignedTechnician: techId }).unwrap();
      toast.success('Technician assigned');
      setTechId('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{ticket.ticketId}</h1>
          <p className="text-sm text-gray-500 mt-1">{ticket.issueCategory} · {ticket.panelSerialNumber}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-3">Customer Details</CardTitle>
          {customer ? (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Name</dt><dd className="font-medium">{customer.name}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd>{customer.email}</dd></div>
              <div><dt className="text-gray-500">Mobile</dt><dd>{customer.mobileNumber}</dd></div>
              <div><dt className="text-gray-500">Organization</dt><dd>{customer.organizationName || '—'}</dd></div>
              <div><dt className="text-gray-500">Customer ID</dt><dd className="font-mono">{customer.customerId}</dd></div>
            </dl>
          ) : <p className="text-sm text-gray-400">—</p>}
        </Card>

        <Card>
          <CardTitle className="mb-3">Ticket Info</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Description</dt><dd className="text-gray-800">{ticket.description}</dd></div>
            <div><dt className="text-gray-500">Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            <div><dt className="text-gray-500">Expected Response</dt><dd className={ticket.isOverdue ? 'text-red-600 font-medium' : ''}>{formatDate(ticket.expectedResponseTime)}{ticket.isOverdue && ' ⚠ OVERDUE'}</dd></div>
            <div><dt className="text-gray-500">Assigned Technician</dt><dd>{tech?.name || '—'}</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <Button onClick={handleStatusUpdate} loading={statusLoading} disabled={!newStatus}>Update Status</Button>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-3">Assign Technician</CardTitle>
          <div className="space-y-3">
            <Select
              options={technicians.map(t => ({ value: t.id, label: `${t.name} (${t.email})` }))}
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
              placeholder="Select technician"
            />
            <Button onClick={handleAssign} loading={assignLoading} disabled={!techId}>Assign</Button>
          </div>
        </Card>
      </div>

      {ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Resolution</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Work Performed</dt><dd>{ticket.resolution.workPerformed}</dd></div>
            <div><dt className="text-gray-500">Parts Used</dt><dd>{ticket.resolution.partsUsed?.join(', ') || '—'}</dd></div>
            <div><dt className="text-gray-500">Resolved At</dt><dd>{formatDate(ticket.resolution.resolvedAt)}</dd></div>
          </dl>
        </Card>
      )}

      <Card>
        <CardTitle className="mb-3">Status Timeline</CardTitle>
        <ol className="relative border-l border-gray-200 space-y-4 ml-2">
          {ticket.statusHistory.map((h: StatusHistory, i) => (
            <li key={i} className="ml-4">
              <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
              <div className="flex items-center gap-2">
                <StatusBadge status={h.status} />
                <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
                {typeof h.changedBy === 'object' && (
                  <span className="text-xs text-gray-400">by {(h.changedBy as { name: string }).name}</span>
                )}
              </div>
              {h.remarks && <p className="text-xs text-gray-500 mt-1">{h.remarks}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
