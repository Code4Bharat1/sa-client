'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetTicketQuery, useUpdateTicketStatusMutation, useSubmitResolutionMutation } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, StatusHistory } from '@/types';
import { Clock, Calendar, Shield, Play, FileText, Image as ImageIcon, Volume2, AlertTriangle } from 'lucide-react';

const TECH_TRANSITIONS: Record<string, string[]> = {
  'Assigned': ['Technician Visit Scheduled', 'In Progress'],
  'Technician Visit Scheduled': ['Technician Visit Scheduled', 'In Progress', 'Assigned'],
  'In Progress': ['Part Required', 'Resolved', 'On Hold'],
  'Part Required': ['In Progress', 'On Hold'],
  'On Hold': ['In Progress'],
  'Reopened': ['Technician Visit Scheduled', 'In Progress'],
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
  const [visitDate, setVisitDate] = useState('');

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-gray-500 py-16">Ticket not found</div>;

  const customer = typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const allowedNext = TECH_TRANSITIONS[ticket.status] || [];

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

  // Compute deadline metrics & colors
  const getDeadlineConfig = () => {
    if (!ticket.resolutionDeadline) return null;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return null;

    const diffMs = new Date(ticket.resolutionDeadline).getTime() - Date.now();
    const isLate = diffMs < 0;
    const absMs = Math.abs(diffMs);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let style = 'bg-green-50 text-green-700 border-green-100';
    let text = `${days}d ${hours}h left (On Track)`;
    let icon = Clock;

    if (isLate) {
      style = 'bg-red-50 text-red-700 border-red-100';
      text = `${days}d ${hours}h overdue`;
      icon = AlertTriangle;
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      style = 'bg-yellow-50 text-yellow-700 border-yellow-100';
      text = `${days}d ${hours}h left (Approaching Deadline)`;
      icon = Clock;
    }

    return { style, text, icon };
  };

  const deadlineConfig = getDeadlineConfig();
  const DeadlineIcon = deadlineConfig?.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Technician View</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-gray-900">{ticket.ticketId}</h1>
          <p className="text-sm text-gray-500 mt-1">{ticket.issueCategory} · {ticket.panelSerialNumber}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Deadline Info Banner */}
      {deadlineConfig && DeadlineIcon && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${deadlineConfig.style} shadow-sm`}>
          <DeadlineIcon className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-medium">
            Resolution Deadline: {formatDate(ticket.resolutionDeadline)} &middot; <span className="underline">{deadlineConfig.text}</span>
          </div>
        </div>
      )}

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-3">Customer & Organization Details</CardTitle>
          {customer ? (
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{customer.name}</dd></div>
              <div><dt className="text-slate-500">Organization</dt><dd>{customer.organizationName || '—'}</dd></div>
              <div><dt className="text-slate-500">Mobile</dt><dd className="font-mono">{customer.mobileNumber}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1">{customer.address || 'No address specified'}</dd></div>
            </dl>
          ) : <p className="text-sm text-slate-400">Customer details not available</p>}
        </Card>

        <Card>
          <CardTitle className="mb-3">Ticket & SLA Info</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Created</dt><dd>{formatDate(ticket.createdAt)}</dd></div>
            <div><dt className="text-slate-500">Expected Response</dt><dd>{formatDate(ticket.expectedResponseTime)}</dd></div>
            <div><dt className="text-slate-500">Scheduled Visit Date</dt><dd className="font-semibold text-indigo-700">{ticket.scheduledVisitDate ? formatDate(ticket.scheduledVisitDate) : 'Not scheduled yet'}</dd></div>
            <div><dt className="text-slate-500">Issue Category</dt><dd>{ticket.issueCategory}</dd></div>
          </dl>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardTitle className="mb-2">Description</CardTitle>
        <p className="text-sm text-slate-800 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
      </Card>

      {/* Media & Attachments Section */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <Card>
          <CardTitle className="mb-3 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary-700" />
            Attachments & Voice Notes
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticket.attachments.map((url, idx) => {
              const isImage = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp');
              const isVideo = url.includes('.mp4');
              const isAudio = url.includes('.webm') || url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a');
              
              return (
                <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between shadow-sm hover:shadow transition">
                  <div className="mb-3">
                    {isImage && (
                      <div className="relative group overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <img src={url} alt="Customer upload" className="max-h-48 w-full object-contain mx-auto transition duration-300 group-hover:scale-105" />
                        <a href={url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition">
                          <ImageIcon className="w-4 h-4 mr-1" /> View Full Image
                        </a>
                      </div>
                    )}
                    {isVideo && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 bg-black">
                        <video src={url} controls className="max-h-48 w-full" />
                      </div>
                    )}
                    {isAudio && (
                      <div className="flex flex-col space-y-2 bg-white border border-slate-200 rounded-lg p-3 shadow-inner">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Volume2 className="w-4 h-4 text-indigo-500" />
                          <span>Customer Voice Note</span>
                        </div>
                        <audio src={url} controls className="w-full" />
                      </div>
                    )}
                    {!isImage && !isVideo && !isAudio && (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                        <FileText className="w-8 h-8 text-primary-600" />
                        <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 hover:underline break-all">
                          Download Document
                        </a>
                      </div>
                    )}
                  </div>
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-primary-600 transition truncate block">
                    {(url.split('/').pop() || '').replace(/^\d+-\d+-/, '').replace(/_/g, ' ')}
                  </a>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Update Status and scheduling section */}
      {allowedNext.length > 0 && !showResolutionForm && (
        <Card>
          <CardTitle className="mb-3">Manage visit schedule & status</CardTitle>
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
            <div className="flex gap-2">
              <Button onClick={handleStatusUpdate} loading={statusLoading} disabled={!newStatus}>Update Status</Button>
              {['In Progress', 'Part Required'].includes(ticket.status) && (
                <Button variant="secondary" onClick={() => setShowResolutionForm(true)}>Submit Resolution</Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Submit Resolution Form */}
      {(showResolutionForm || ticket.status === 'In Progress') && !ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Submit Ticket Resolution</CardTitle>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Performed *</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={4}
                placeholder="Describe the work performed..."
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parts Used (comma-separated)</label>
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Touch panel, HDMI cable"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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

      {/* Resolution Details */}
      {ticket.resolution && (
        <Card>
          <CardTitle className="mb-3">Resolution Details</CardTitle>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Work Performed</dt><dd className="text-slate-900 font-medium">{ticket.resolution.workPerformed}</dd></div>
            <div><dt className="text-slate-500">Parts Used</dt><dd>{ticket.resolution.partsUsed?.join(', ') || '—'}</dd></div>
            <div><dt className="text-slate-500">Resolved At</dt><dd>{formatDate(ticket.resolution.resolvedAt)}</dd></div>
          </dl>
        </Card>
      )}

      {/* Status History Timeline */}
      <Card>
        <CardTitle className="mb-4">Full Status Timeline</CardTitle>
        <ol className="relative border-l-2 border-slate-100 space-y-4 ml-2">
          {ticket.statusHistory.map((h: StatusHistory, i) => {
            const isPriorityUpdate = h.remarks?.toLowerCase().includes('priority');
            const isDeadlineUpdate = h.remarks?.toLowerCase().includes('deadline');

            return (
              <li key={i} className="ml-5">
                <div className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full bg-primary-800 border-2 border-white shadow-sm" />
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
    </div>
  );
}
