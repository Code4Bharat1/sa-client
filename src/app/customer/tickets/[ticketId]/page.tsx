'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetTicketQuery, useConfirmResolutionMutation, useReopenTicketMutation, useSubmitFeedbackMutation } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, Star } from 'lucide-react';
import { StatusHistory } from '@/types';

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
          <dd className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{ticket.description}</dd>
        </div>
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

      {canConfirm && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Confirm Resolution</h2>
          <p className="text-sm text-gray-600 mb-4">Is your issue resolved? Please confirm to close the ticket.</p>
          <div className="flex gap-3">
            <Button onClick={handleConfirm} loading={confirming}><CheckCircle className="w-4 h-4" /> Yes, Resolved</Button>
            <Button variant="outline" onClick={() => setShowReopen(true)}><RefreshCw className="w-4 h-4" /> Issue Persists (Reopen)</Button>
          </div>
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
