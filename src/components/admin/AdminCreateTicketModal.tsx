'use client';
import React, { useState, useEffect } from 'react';
import { useCreateTicketMutation } from '@/store/api/ticketsApi';
import { useListTechniciansQuery } from '@/store/api/reportsApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ISSUE_CATEGORIES, IssueCategory } from '@/types';
import toast from 'react-hot-toast';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Tag,
} from 'lucide-react';

interface AdminCreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CATEGORY_OPTIONS = ISSUE_CATEGORIES.map((c) => ({ value: c, label: c }));

export const AdminCreateTicketModal: React.FC<AdminCreateTicketModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { accessToken } = useAuth();
  const [createTicket, { isLoading: isSubmitting }] = useCreateTicketMutation();

  // Customer details (direct input)
  const [customName, setCustomName] = useState('');
  const [customOrg, setCustomOrg] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customMobile, setCustomMobile] = useState('');

  // Ticket details
  const [panelSerial, setPanelSerial] = useState('');
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0]);
  const [priority, setPriority] = useState<string>('medium');
  const [assignedTechId, setAssignedTechId] = useState('');
  const [description, setDescription] = useState('');

  // Mandatory Single Photo Upload
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Query for technicians list
  const { data: techData } = useListTechniciansQuery(undefined, { skip: !isOpen });
  const technicians = techData?.data || [];

  // Upload single photo handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files (JPEG, PNG, WebP) are allowed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image size must be under 20MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tickets/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      const data = await response.json();
      setPhotoUrl(data.url);
      setPhotoName(file.name);
      toast.success('Photo uploaded');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
    setPhotoName('');
  };

  const resetForm = () => {
    setCustomName('');
    setCustomOrg('');
    setCustomEmail('');
    setCustomMobile('');
    setPanelSerial('');
    setCategory(ISSUE_CATEGORIES[0]);
    setPriority('medium');
    setAssignedTechId('');
    setDescription('');
    setPhotoUrl(null);
    setPhotoName('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!panelSerial.trim()) {
      toast.error('Please enter a panel serial number');
      return;
    }
    if (!category) {
      toast.error('Please select an issue category');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error('Description must be at least 5 characters');
      return;
    }
    if (!photoUrl) {
      toast.error('Please upload a photo of the issue (mandatory)');
      return;
    }

    try {
      const payload: any = {
        customCustomerName: customName.trim(),
        customOrganizationName: customOrg.trim() || undefined,
        customCustomerEmail: customEmail.trim() || undefined,
        customCustomerMobile: customMobile.trim() || undefined,
        panelSerialNumber: panelSerial.trim(),
        issueCategory: category as IssueCategory,
        description: description.trim(),
        priority,
        attachments: [photoUrl],
      };

      if (assignedTechId) {
        payload.assignedTechnician = assignedTechId;
      }

      const res = await createTicket(payload).unwrap();
      toast.success(`Ticket ${res.data?.ticketId || ''} created successfully!`);
      resetForm();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message || 'Failed to create ticket';
      toast.error(errorMsg);
    }
  };

  const technicianOptions = [
    { value: '', label: '— Unassigned —' },
    ...technicians.map((t) => ({
      value: t.id || (t as any)._id,
      label: `${t.name} (${t.email})`,
    })),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-600" />
              Create Support Ticket
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ticket ID is auto-generated upon creation. All 9 table columns will be updated automatically.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-sm">
          {/* Customer Details */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Customer & Organization Details
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <Input
                  label="Customer Name *"
                  placeholder="e.g. Nilesh Chadage"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  label="Organization / School Name"
                  placeholder="e.g. Alankar Classes"
                  value={customOrg}
                  onChange={(e) => setCustomOrg(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Customer Email (for email notification)"
                  type="email"
                  placeholder="customer@example.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Customer Mobile"
                  placeholder="e.g. 9876543210"
                  value={customMobile}
                  onChange={(e) => setCustomMobile(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Panel Serial Number & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Panel Serial Number *"
                placeholder="e.g. IFPD-2026-8574"
                value={panelSerial}
                onChange={(e) => setPanelSerial(e.target.value)}
                required
              />
            </div>
            <div>
              <Select
                label="Issue Category *"
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Priority & Technician Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
            <div>
              <Select
                label="Assign Technician (Optional)"
                options={technicianOptions}
                value={assignedTechId}
                onChange={(e) => setAssignedTechId(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Problem Description *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue reported by the customer..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Mandatory Single Photo Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Photo Attachment <span className="text-red-500">* (Mandatory)</span>
              </label>
              {!photoUrl && (
                <span className="text-[11px] text-amber-600 font-medium">1 Photo required</span>
              )}
            </div>

            {photoUrl ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white flex-shrink-0 flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate max-w-xs">
                    <p className="text-sm font-medium text-slate-800 truncate">{photoName || 'Uploaded Photo'}</p>
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      ✓ Attached to ticket
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                className={`border-2 border-dashed border-slate-300 hover:border-primary-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-primary-50/20 ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="text-xs text-slate-500 mt-2">Uploading photo...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2 text-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">
                      Click to upload 1 photo of the issue <span className="text-red-500 font-bold">*</span>
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      JPEG, PNG, or WebP (Max 20MB)
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="min-w-[130px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
