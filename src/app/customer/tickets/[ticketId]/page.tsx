'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetTicketQuery, useConfirmResolutionMutation, useReopenTicketMutation, useSubmitFeedbackMutation } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, Star } from 'lucide-react';
import { User, StatusHistory } from '@/types';

export default function CustomerTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading, refetch } = useGetTicketQuery(ticketId);
  const ticket = data?.data;

  const [confirm, { isLoading: confirming }] = useConfirmResolutionMutation();
  const [reopen, { isLoading: reopening }] = useReopenTicketMutation();
  const [feedback, { isLoading: feedbacking }] = useSubmitFeedbackMutation();

  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (isLoading) return <Spinner className="py-16" />;
  if (!ticket) return <div className="text-center text-gray-500 py-16">Ticket not found</div>;

  const canConfirm = ticket.status === 'Customer Confirmation Pending' || ticket.status === 'Resolved';
  const canReopen = ticket.status === 'Closed' && !ticket.feedback;
  const canFeedback = ticket.status === 'Closed' && !ticket.feedback;

  const handleConfirm = async () => {
    try {
      await confirm(ticketId).unwrap();
      toast.success('Resolution confirmed! Ticket closed.');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      await reopen({ ticketId, reason: reopenReason }).unwrap();
      toast.success('Ticket reopened');
      setShowReopen(false);
      setReopenReason('');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  const handleFeedback = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    try {
      await feedback({ ticketId, rating, comment }).unwrap();
      toast.success('Thank you for your feedback!');
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{ticket.ticketId}</h1>
          <p className="text-gray-500 text-sm mt-1">{ticket.issueCategory}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Ticket Details</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Panel Serial', ticket.panelSerialNumber],
            ['Created', formatDate(ticket.createdAt)],
            ['Expected Response', formatDate(ticket.expectedResponseTime)],
            ['Scheduled Visit', ticket.scheduledVisitDate ? formatDate(ticket.scheduledVisitDate) : '—'],
            ['Closed At', formatDate(ticket.closedAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <dt className="text-sm text-gray-500 mb-1">Description</dt>
          <dd className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{ticket.description}</dd>
        </div>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <dt className="text-sm font-medium text-gray-700 mb-2">Attachments & Voice Notes</dt>
            <dd className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.attachments.map((url, idx) => {
                const isImage = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp');
                const isVideo = url.includes('.mp4');
                const isAudio = url.includes('.webm') || url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a');
                
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
            </dd>
          </div>
        )}
      </Card>

      {ticket.resolution && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Resolution Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Work Performed</dt>
              <dd className="text-gray-800 mt-0.5">{ticket.resolution.workPerformed}</dd>
            </div>
            {ticket.resolution.partsUsed?.length > 0 && (
              <div>
                <dt className="text-gray-500">Parts Used</dt>
                <dd className="text-gray-800">{ticket.resolution.partsUsed.join(', ')}</dd>
              </div>
            )}
            {ticket.resolution.remarks && (
              <div>
                <dt className="text-gray-500">Remarks</dt>
                <dd className="text-gray-800">{ticket.resolution.remarks}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Status Timeline</h2>
        <ol className="relative border-l border-gray-200 space-y-4 ml-2">
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
                  <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
                  {typeof h.changedBy === 'object' && (
                    <span className="text-xs text-gray-500">— {(h.changedBy as { name: string; role: string }).name} ({(h.changedBy as { name: string; role: string }).role})</span>
                  )}
                </div>
                {h.remarks && <p className="text-xs text-slate-500 mt-1 ml-0.5">{h.remarks}</p>}
              </li>
            );
          })}
        </ol>
      </Card>

      {canConfirm && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Confirm Resolution</h2>
          <p className="text-sm text-gray-600 mb-4">Is your issue resolved? Please confirm to close the ticket.</p>
          {!showReopen ? (
            <div className="flex gap-3">
              <Button onClick={handleConfirm} loading={confirming}><CheckCircle className="w-4 h-4" /> Yes, Resolved</Button>
              <Button variant="outline" onClick={() => setShowReopen(true)}><RefreshCw className="w-4 h-4" /> Issue Persists (Reopen)</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="Describe why the issue persists and why you are reopening this ticket..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button loading={reopening} onClick={handleReopen}>Submit Reopen</Button>
                <Button variant="ghost" onClick={() => setShowReopen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {canReopen && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Reopen Ticket</h2>
          {!showReopen ? (
            <Button variant="outline" onClick={() => setShowReopen(true)}><RefreshCw className="w-4 h-4" /> Reopen Ticket</Button>
          ) : (
            <div className="space-y-3">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="Describe why you are reopening this ticket..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button loading={reopening} onClick={handleReopen}>Submit Reopen</Button>
                <Button variant="ghost" onClick={() => setShowReopen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {canFeedback && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Rate Your Experience</h2>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`w-8 h-8 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3"
            rows={3}
            placeholder="Comments (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button loading={feedbacking} onClick={handleFeedback}>Submit Feedback</Button>
        </Card>
      )}

      {ticket.feedback && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Your Feedback</h2>
          <div className="flex gap-1 mb-1">
            {[1,2,3,4,5].map((s) => <Star key={s} className={`w-5 h-5 ${s <= ticket.feedback!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}
          </div>
          {ticket.feedback.comment && <p className="text-sm text-gray-600">{ticket.feedback.comment}</p>}
        </Card>
      )}
    </div>
  );
}
