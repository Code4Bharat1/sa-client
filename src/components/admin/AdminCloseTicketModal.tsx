'use client';
import React, { useState, useEffect } from 'react';
import { useUpdateTicketStatusMutation } from '@/store/api/ticketsApi';
import { useListTechniciansQuery } from '@/store/api/reportsApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Ticket, User } from '@/types';
import toast from 'react-hot-toast';
import {
  X,
  CheckCircle2,
  Calendar,
  UserCheck,
  Wrench,
  FileCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AdminCloseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onClosed: () => void;
}

export const AdminCloseTicketModal: React.FC<AdminCloseTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onClosed,
}) => {
  const [updateStatus, { isLoading: isSubmitting }] = useUpdateTicketStatusMutation();
  const { data: techData } = useListTechniciansQuery(undefined, { skip: !isOpen });
  const technicians = techData?.data || [];

  const customer = ticket && typeof ticket.customerId === 'object' ? (ticket.customerId as User) : null;
  const assignedTechObj = ticket && typeof ticket.assignedTechnician === 'object' ? (ticket.assignedTechnician as User) : null;

  // Form State - Requested Fields
  const [issueDate, setIssueDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientInstitution, setClientInstitution] = useState('');
  const [technicianVisit, setTechnicianVisit] = useState('');
  const [clientAcknowledgment, setClientAcknowledgment] = useState('');
  const [clientIssue, setClientIssue] = useState('');
  const [problemSolved, setProblemSolved] = useState('');
  const [closureDate, setClosureDate] = useState('');

  // Pre-fill values when ticket changes or modal opens
  useEffect(() => {
    if (ticket && isOpen) {
      // 1. Issue Date: formatted as YYYY-MM-DD
      const createdDate = ticket.createdAt
        ? new Date(ticket.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setIssueDate(createdDate);

      // 2. Client Name
      setClientName(customer?.name || (ticket as any).customCustomerName || '');

      // 3. Client Institutions
      setClientInstitution(customer?.organizationName || (ticket as any).customOrganizationName || '');

      // 4. Technician Details: auto-select assigned technician from ticket issue
      if (assignedTechObj?.name) {
        setTechnicianVisit(assignedTechObj.name);
      } else if (typeof ticket.assignedTechnician === 'string' && ticket.assignedTechnician) {
        const found = technicians.find((t: any) => t._id === ticket.assignedTechnician || t.id === ticket.assignedTechnician);
        setTechnicianVisit(found?.name || ticket.assignedTechnician);
      } else {
        setTechnicianVisit('No Technician Visit (Resolved Remotely)');
      }

      // 5. Client Acknowledgment (Optional)
      setClientAcknowledgment('');

      // 6. Client Issue
      const issueDesc = ticket.issueCategory
        ? `[${ticket.issueCategory}] ${ticket.description || ''}`
        : ticket.description || '';
      setClientIssue(issueDesc);

      // 7. What Was Solved
      setProblemSolved(ticket.resolution?.workPerformed || '');

      // 8. Closure Date: defaults to today
      setClosureDate(new Date().toISOString().split('T')[0]);
    }
  }, [ticket, isOpen, assignedTechObj, technicians]);

  if (!isOpen || !ticket) return null;

  // Build technician dropdown options
  const techOptions = [
    { value: 'No Technician Visit (Resolved Remotely)', label: '— No Technician Visit / Resolved Remotely —' },
    ...technicians.map((t: any) => ({
      value: t.name,
      label: `${t.name} (${t.email})`,
    })),
  ];

  // If assigned technician is known and not in the fetched list yet, include them explicitly
  if (assignedTechObj?.name && !techOptions.some((o) => o.value === assignedTechObj.name)) {
    techOptions.splice(1, 0, {
      value: assignedTechObj.name,
      label: `${assignedTechObj.name}${assignedTechObj.email ? ` (${assignedTechObj.email})` : ''} (Assigned)`,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemSolved.trim()) {
      toast.error('Please describe what was solved to fix the problem');
      return;
    }

    try {
      await updateStatus({
        ticketId: ticket.ticketId,
        status: 'Closed',
        remarks: problemSolved.trim(),
        closeDetails: {
          issueDate: issueDate || undefined,
          clientName: clientName.trim() || undefined,
          clientInstitution: clientInstitution.trim() || undefined,
          technicianVisit: technicianVisit.trim() || undefined,
          clientAcknowledgment: clientAcknowledgment.trim() || undefined,
          clientIssue: clientIssue.trim() || undefined,
          problemSolved: problemSolved.trim(),
          closureDate: closureDate || undefined,
        },
      }).unwrap();

      toast.success(`Ticket #${ticket.ticketId} closed successfully!`);
      onClosed();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message || 'Failed to close ticket';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Close Ticket <span className="font-mono text-primary-700">#{ticket.ticketId}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Fill in the resolution details below to officially close this support ticket.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-sm">
          {/* Client & Institution Info Card */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary-600" />
              Client & Institution Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Client Name"
                  placeholder="e.g. Ramesh Patil"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="Client Institutions / Organization"
                  placeholder="e.g. Model High School"
                  value={clientInstitution}
                  onChange={(e) => setClientInstitution(e.target.value)}
                />
              </div>
            </div>

            {/* Dates: Issue Date & Closure Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Issue Date
                </label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Closure Date *
                </label>
                <input
                  type="date"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 font-medium text-slate-800"
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Technician Visit Details Dropdown */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-primary-600" />
              Technician Details / Visit
            </label>
            <Select
              options={techOptions}
              value={technicianVisit}
              onChange={(e) => setTechnicianVisit(e.target.value)}
            />
          </div>

          {/* Client Issue Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Client Issue (Reported Problem)
            </label>
            <textarea
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 resize-none bg-slate-50/50"
              placeholder="Summary of issue reported by the client..."
              value={clientIssue}
              onChange={(e) => setClientIssue(e.target.value)}
            />
          </div>

          {/* What Was Solved / Resolution Details */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                What Was Solved / Problem Solution <span className="text-red-500">*</span>
              </span>
              <span className="text-xs text-slate-400">Required</span>
            </label>
            <textarea
              rows={3}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 resize-none"
              placeholder="Explain what was solved and what actions were performed to fix the panel issue..."
              value={problemSolved}
              onChange={(e) => setProblemSolved(e.target.value)}
            />
          </div>

          {/* Client Acknowledgment {Optional} */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              Client Acknowledgment <span className="text-slate-400 font-normal text-xs">{'{optional}'}</span>
            </label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
              placeholder="e.g. Principal confirmed on call / signed satisfaction note received"
              value={clientAcknowledgment}
              onChange={(e) => setClientAcknowledgment(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white min-w-[150px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Closing Ticket...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Close Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
