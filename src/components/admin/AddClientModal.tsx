'use client';

import React, { useState, useEffect } from 'react';
import {
  useCreateClientMutation,
  useUpdateClientMutation,
  ClientItem,
} from '@/store/api/clientsApi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Layers,
  AlertCircle,
  Plus,
  Pencil,
} from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientToEdit?: ClientItem | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientToEdit,
}) => {
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const isSubmitting = isCreating || isUpdating;

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [panelInfo, setPanelInfo] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setClientName(clientToEdit.clientName || '');
        setClientEmail(clientToEdit.clientEmail || '');
        setClientMobile(clientToEdit.clientMobile || '');
        setAddress(clientToEdit.address || '');
        setDate(clientToEdit.date || new Date().toISOString().split('T')[0]);
        setPanelInfo(clientToEdit.panelInfo || '');
      } else {
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
        setClientName('');
        setClientEmail('');
        setClientMobile('');
        setAddress('');
        setPanelInfo('');
      }
      setErrors({});
    }
  }, [isOpen, clientToEdit]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!clientName.trim()) {
      errs.clientName = 'Client name is required';
    } else if (clientName.trim().length < 2) {
      errs.clientName = 'Client name must be at least 2 characters';
    }

    if (!clientEmail.trim()) {
      errs.clientEmail = 'Client email is required';
    } else if (!EMAIL_REGEX.test(clientEmail.trim())) {
      errs.clientEmail = 'Please enter a valid email address';
    }

    const cleanMobile = clientMobile.replace(/\D/g, '');
    if (!clientMobile.trim()) {
      errs.clientMobile = 'Client mobile number is required';
    } else if (cleanMobile.length < 10) {
      errs.clientMobile = 'Mobile number must have at least 10 digits';
    }

    if (!address.trim()) {
      errs.address = 'Address is required';
    } else if (address.trim().length < 3) {
      errs.address = 'Address must be at least 3 characters';
    }

    if (!date.trim()) {
      errs.date = 'Date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (clientToEdit) {
        await updateClient({
          id: clientToEdit._id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim().toLowerCase(),
          clientMobile: clientMobile.trim(),
          address: address.trim(),
          date: date.trim(),
          panelInfo: panelInfo.trim(),
        }).unwrap();
        toast.success('Client updated successfully!');
      } else {
        await createClient({
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim().toLowerCase(),
          clientMobile: clientMobile.trim(),
          address: address.trim(),
          date: date.trim(),
          panelInfo: panelInfo.trim(),
        }).unwrap();
        toast.success('Client added successfully!');
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Operation failed';
      toast.error(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-primary-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-800 flex items-center justify-center text-gold-400 shrink-0">
              {clientToEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {clientToEdit ? 'Edit Client' : 'Add New Client'}
              </h3>
              <p className="text-xs text-slate-300">
                {clientToEdit
                  ? 'Update client details and panel information'
                  : 'Enter client details and panel information'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-primary-800 transition disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* 1. Client Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter client or institution name"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all ${
                  errors.clientName ? 'border-rose-300 focus:border-rose-400 ring-rose-100' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.clientName && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.clientName}
              </p>
            )}
          </div>

          {/* 2. Client Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="client@organization.com"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  if (errors.clientEmail) setErrors((prev) => ({ ...prev, clientEmail: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all ${
                  errors.clientEmail ? 'border-rose-300 focus:border-rose-400 ring-rose-100' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.clientEmail && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.clientEmail}
              </p>
            )}
          </div>

          {/* 3. Client Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={clientMobile}
                onChange={(e) => {
                  setClientMobile(e.target.value);
                  if (errors.clientMobile) setErrors((prev) => ({ ...prev, clientMobile: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all ${
                  errors.clientMobile ? 'border-rose-300 focus:border-rose-400 ring-rose-100' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.clientMobile && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.clientMobile}
              </p>
            )}
          </div>

          {/* 4. Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={2}
                placeholder="Street address, city, state, postal code"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all resize-none ${
                  errors.address ? 'border-rose-300 focus:border-rose-400 ring-rose-100' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.address && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.address}
              </p>
            )}
          </div>

          {/* 5. Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all ${
                  errors.date ? 'border-rose-300 focus:border-rose-400 ring-rose-100' : 'border-slate-300'
                }`}
              />
            </div>
            {errors.date && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.date}
              </p>
            )}
          </div>

          {/* 6. Panel Info (Textarea) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Panel Info <span className="text-slate-400 font-normal">(Details, Serials, Specifications)</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                rows={3}
                placeholder="e.g. 75-inch Interactive Flat Panel, Serial: SA-75-0012, 4K UHD, Wall-mounted in Conference Room"
                value={panelInfo}
                onChange={(e) => setPanelInfo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white transition-all resize-y"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Describe panel models, dimensions, serial numbers or configuration notes.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold px-4 flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-3.5 h-3.5" />
                  <span>{clientToEdit ? 'Updating Client...' : 'Saving Client...'}</span>
                </>
              ) : (
                <>
                  {clientToEdit ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{clientToEdit ? 'Save Changes' : 'Save Client'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
