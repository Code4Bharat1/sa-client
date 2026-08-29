'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useGetTicketQuery, useUpdateTicketStatusMutation, useAssignTicketMutation,
  useUpdateTicketPriorityMutation, useUpdateTicketDeadlineMutation,
} from '@/store/api/ticketsApi';
import { useListTechniciansQuery } from '@/store/api/reportsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, StatusHistory } from '@/types';
import { Shield, MessageSquare, ExternalLink, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'Open': ['Under Review', 'Assigned', 'Closed'],
  'Under Review': ['Assigned', 'On Hold', 'Closed'],
  'Assigned': ['Technician Visit Scheduled', 'In Progress', 'On Hold', 'Closed'],
  'Technician Visit Scheduled': ['Technician Visit Scheduled', 'In Progress', 'On Hold', 'Assigned', 'Closed'],
  'In Progress': ['Part Required', 'Resolved', 'On Hold', 'Closed'],
  'Part Required': ['In Progress', 'On Hold', 'Closed'],
  'On Hold': ['In Progress', 'Assigned', 'Closed'],
  'Resolved': ['Customer Confirmation Pending', 'Closed'],
  'Customer Confirmation Pending': ['Closed', 'Reopened'],
  'Reopened': ['Under Review', 'Assigned', 'Closed'],
};

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading, refetch } = useGetTicketQuery(ticketId);
  const ticket = data?.data;
  
  const { data: techData } = useListTechniciansQuery();
  const technicians = techData?.data || [];

  const [updateStatus, { isLoading: statusLoading }] = useUpdateTicketStatusMutation();
  const [assign, { isLoading: assignLoading }] = useAssignTicketMutation();
  const [updatePriority, { isLoading: priorityLoading }] = useUpdateTicketPriorityMutation();
  const [updateDeadline, { isLoading: deadlineLoading }] = useUpdateTicketDeadlineMutation();

  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [techId, setTechId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDeadline, setSelectedDeadline] = useState('');

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeRemarks, setCloseRemarks] = useState('');

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-slate-500 py-16">Ticket not found</div>;

  const customer = typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const tech = typeof ticket.assignedTechnician === 'object' ? (ticket.assignedTechnician as User) : null;
  
  const allowedNext = STATUS_TRANSITIONS[ticket.status] || [];

  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error('Select a status'); return; }
    if (newStatus === 'Technician Visit Scheduled' && !visitDate) {
      toast.error('Please specify the scheduled visit date & time');
      return;
    }
    try {
      await updateStatus({
        ticketId,
        status: newStatus,
        remarks,
        scheduledVisitDate: newStatus === 'Technician Visit Scheduled' ? visitDate : undefined
      }).unwrap();
      toast.success('Status updated');
      setNewStatus(''); setRemarks(''); setVisitDate('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to update status');
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
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to assign technician');
    }
  };

  const handlePriorityUpdate = async () => {
    if (!selectedPriority) { toast.error('Select a priority'); return; }
    try {
      await updatePriority({ ticketId, priority: selectedPriority }).unwrap();
      toast.success('Priority updated');
      setSelectedPriority('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to update priority');
    }
  };

  const handleDeadlineUpdate = async () => {
    if (!selectedDeadline) { toast.error('Select a deadline'); return; }
    try {
      await updateDeadline({ ticketId, resolutionDeadline: selectedDeadline }).unwrap();
      toast.success('Deadline updated');
      setSelectedDeadline('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to update deadline');
    }
  };

  const handleDirectClose = async () => {
    try {
      await updateStatus({
        ticketId,
        status: 'Closed',
        remarks: closeRemarks.trim() || 'Closed by administrator',
      }).unwrap();
      toast.success('Ticket closed successfully');
      setIsCloseModalOpen(false);
      setCloseRemarks('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message || 'Failed to close ticket');
    }
  };

  const getDeadlineStatus = () => {
    if (!ticket.resolutionDeadline) return null;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return null;
    const deadlineTime = new Date(ticket.resolutionDeadline).getTime();
    const now = Date.now();
    const diffMs = deadlineTime - now;
    const isOverdue = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);
    const diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (isOverdue) {
      return {
        text: `Overdue by ${diffDays}d ${diffHours}h`,
        isOverdue: true
      };
    } else {
      return {
        text: `${diffDays}d ${diffHours}h remaining`,
        isOverdue: false
      };
    }
  };

  const deadlineStatus = getDeadlineStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-gold-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Admin View</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-900 font-mono tracking-tight whitespace-nowrap">{ticket.ticketId}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words">{ticket.issueCategory} · {ticket.panelSerialNumber}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== 'Closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCloseModalOpen(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 flex items-center gap-1.5 text-xs py-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-rose-600" />
              Close Ticket
            </Button>
          )}
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
            <div><dt className="text-slate-500">Description</dt><dd className="text-slate-800 bg-slate-50 rounded p-2 text-xs whitespace-pre-wrap">{ticket.description}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            <div><dt className="text-slate-500">Scheduled Visit</dt><dd>{ticket.scheduledVisitDate ? formatDate(ticket.scheduledVisitDate) : '—'}</dd></div>
            <div><dt className="text-slate-500">Expected Response</dt><dd className={ticket.isOverdue ? 'text-red-600 font-semibold' : ''}>{formatDate(ticket.expectedResponseTime)}</dd></div>
            <div>
              <dt className="text-slate-500">Resolution Deadline</dt>
              <dd className="flex items-center gap-2">
                <span>{ticket.resolutionDeadline ? formatDate(ticket.resolutionDeadline) : '—'}</span>
                {deadlineStatus && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    deadlineStatus.isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {deadlineStatus.text}
                  </span>
                )}
              </dd>
            </div>
            <div><dt className="text-slate-500">Assigned Technician</dt><dd>{tech?.name || '—'}</dd></div>
            <div><dt className="text-slate-500">Reopen Count</dt><dd>{ticket.reopenStatus.reopenCount}</dd></div>
          </dl>
        </Card>
      </div>

      {ticket.attachments && ticket.attachments.length > 0 && (
        <Card>
          <CardTitle className="mb-3">Attachments & Voice Notes</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticket.attachments.map((url, idx) => {
              const lowerUrl = url.toLowerCase();
              const isImage = /\.(jpe?g|png|webp|gif|svg|bmp|jfif)($|\?)/i.test(url) || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp');
              const isVideo = lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
              const isAudio = lowerUrl.includes('.webm') || lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.ogg') || lowerUrl.includes('.m4a');
              
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col justify-between">
                  <div className="mb-2">
                    {isImage && (
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Attachment" className="max-h-40 rounded object-contain mx-auto border border-gray-200" />
                      </a>
                    )}
                    {isVideo && (
                      <video src={url} controls className="max-h-40 w-full rounded border border-gray-200" />
                    )}
                    {isAudio && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-semibold text-gray-500">Voice Note</span>
                        <audio src={url} controls className="w-full h-8" />
                      </div>
                    )}
                    {!isImage && !isVideo && !isAudio && (
                      <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline break-all block">
                        Download File
                      </a>
                    )}
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary-600 transition truncate block">
                    {(url.split('/').pop() || '').replace(/^\d+-\d+-/, '').replace(/_/g, ' ')}
                  </a>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Live Customer Discussion Shortcut */}
      <Card className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50/70 to-indigo-50/70 border-primary-100/80 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-600 text-white rounded-xl shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Live Customer Discussion</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct support chat console with customer for ticket <span className="font-mono font-medium text-primary-700">#{ticket.ticketId}</span>
            </p>
          </div>
        </div>
        <Link
          href={`/admin/chat?ticketId=${ticket.ticketId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition"
        >
          Open Live Support Chat <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </Card>

      {/* Interactive Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardTitle className="mb-3">Update Status</CardTitle>
          <div className="space-y-3">
            <Select
              options={allowedNext.map(s => ({
                value: s,
                label: s === 'Assigned' && ticket.status === 'Technician Visit Scheduled' ? 'Cancel Visit (Revert to Assigned)' : s
              }))}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="Select next status"
            />
            {newStatus === 'Technician Visit Scheduled' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Visit Date & Time *</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
              </div>
            )}
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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

        <Card>
          <CardTitle className="mb-3">Priority & Deadline</CardTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket Priority</label>
              <div className="flex gap-2">
                <Select
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  placeholder="Select Priority"
                  className="flex-1"
                />
                <Button onClick={handlePriorityUpdate} loading={priorityLoading} disabled={!selectedPriority}>Update</Button>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Deadline</label>
              <div className="flex flex-col gap-2">
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedDeadline}
                  onChange={(e) => setSelectedDeadline(e.target.value)}
                />
                <Button onClick={handleDeadlineUpdate} loading={deadlineLoading} disabled={!selectedDeadline}>Set Deadline</Button>
              </div>
            </div>
          </div>
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
          {ticket.statusHistory.map((h: StatusHistory, i) => {
            const isPriorityUpdate = h.remarks?.toLowerCase().includes('priority');
            const isDeadlineUpdate = h.remarks?.toLowerCase().includes('deadline');
            
            return (
              <li key={i} className="ml-5">
                <div className="absolute -left-[9px] mt-0.5 w-4 h-4 rounded-full bg-primary-800 border-2 border-white shadow-sm" />
                <div className="flex items-center gap-2 flex-wrap">
                  {isPriorityUpdate ? (
                    <Badge className="bg-amber-100 text-amber-800">Priority Update</Badge>
                  ) : isDeadlineUpdate ? (
                    <Badge className="bg-rose-100 text-rose-800">Deadline Update</Badge>
                  ) : (
                    <StatusBadge status={h.status} />
                  )}
                  <span className="text-xs text-slate-400">{formatDate(h.timestamp)}</span>
                  {typeof h.changedBy === 'object' && (
                    <span className="text-xs text-slate-500">— {(h.changedBy as { name: string; role: string }).name} ({(h.changedBy as { name: string; role: string }).role})</span>
                  )}
                </div>
                {h.remarks && <p className="text-xs text-slate-500 mt-1 ml-0.5">{h.remarks}</p>}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Close Ticket Confirmation Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-rose-600" />
                Close Ticket #{ticket.ticketId}
              </h3>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to officially close this ticket? This will mark the ticket as closed, lock the chat, and notify the customer via email.
            </p>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Closing Remarks (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="e.g. Issue resolved directly over phone call."
                value={closeRemarks}
                onChange={(e) => setCloseRemarks(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={statusLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDirectClose}
                loading={statusLoading}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
