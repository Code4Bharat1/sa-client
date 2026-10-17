'use client';
import React, { useState } from 'react';
import {
  useGetAcknowledgmentsQuery,
  useCreateAcknowledgmentMutation,
  useUpdateAcknowledgmentDateMutation,
  useUpdateAcknowledgmentMutation,
  useDeleteAcknowledgmentMutation,
} from '@/store/api/acknowledgmentsApi';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BackButton } from '@/components/ui/BackButton';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FileCheck,
  Mail,
  Building,
  User,
  Users,
  CheckCircle,
  Search,
  Camera,
  Trash2,
  ImageIcon,
  Eye,
  Shield,
  X,
  Loader2,
  Calendar,
  Pencil,
  AlertCircle,
} from 'lucide-react';

export default function AdminAcknowledgmentsPage() {
  const { data, isLoading, refetch } = useGetAcknowledgmentsQuery();
  const [createAck, { isLoading: submitting }] = useCreateAcknowledgmentMutation();
  const [updateAckDate, { isLoading: updatingDate }] = useUpdateAcknowledgmentDateMutation();
  const [updateAck, { isLoading: updatingAck }] = useUpdateAcknowledgmentMutation();
  const [deleteAck, { isLoading: deletingAck }] = useDeleteAcknowledgmentMutation();

  // Form State
  const [clientName, setClientName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [trainingDate, setTrainingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [trainersCount, setTrainersCount] = useState<number | ''>(1);
  const [traineeNames, setTraineeNames] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [trainingImage, setTrainingImage] = useState<string | null>(null);

  // Search & Modal State
  const [search, setSearch] = useState('');
  const [selectedAck, setSelectedAck] = useState<any | null>(null);
  const [editDate, setEditDate] = useState('');

  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Edit & Delete Modal States
  const [ackToEdit, setAckToEdit] = useState<any | null>(null);
  const [ackToDelete, setAckToDelete] = useState<any | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editInstitutionName, setEditInstitutionName] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editTrainingDate, setEditTrainingDate] = useState('');
  const [editTrainersCount, setEditTrainersCount] = useState<number | ''>(1);
  const [editTraineeNames, setEditTraineeNames] = useState('');

  const handleOpenInspection = (ack: any) => {
    setSelectedAck(ack);
    const initialDate = ack.trainingDate
      ? new Date(ack.trainingDate).toISOString().split('T')[0]
      : new Date(ack.createdAt).toISOString().split('T')[0];
    setEditDate(initialDate);
  };

  const handleOpenEdit = (ack: any) => {
    setAckToEdit(ack);
    setEditErrors({});
    setEditClientName(ack.clientName || '');
    setEditInstitutionName(ack.institutionName || '');
    setEditClientEmail(ack.clientEmail || '');
    setEditTrainingDate(
      ack.trainingDate
        ? new Date(ack.trainingDate).toISOString().split('T')[0]
        : new Date(ack.createdAt).toISOString().split('T')[0]
    );
    setEditTrainersCount(ack.trainersPresentCount || 1);
    setEditTraineeNames(ack.traineeNames || '');
  };

  const validateEditForm = (): boolean => {
    const errs: Record<string, string> = {};
    const missing: string[] = [];

    if (!editClientName.trim()) {
      errs.clientName = 'Client Name is required';
      missing.push('Client Name');
    } else if (editClientName.trim().length < 2) {
      errs.clientName = 'Client Name must be at least 2 characters';
    }

    if (!editInstitutionName.trim()) {
      errs.institutionName = 'Institution Name is required';
      missing.push('Institution Name');
    } else if (editInstitutionName.trim().length < 2) {
      errs.institutionName = 'Institution Name must be at least 2 characters';
    }

    if (!editTrainingDate || !editTrainingDate.trim()) {
      errs.trainingDate = 'Training Date is required';
      missing.push('Training Date');
    }

    if (editClientEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editClientEmail.trim())) {
        errs.clientEmail = 'Please enter a valid email address';
      }
    }

    setEditErrors(errs);

    if (missing.length > 0) {
      if (missing.length === 3) {
        toast.error('Client Name, Institution Name, and Training Date are required');
      } else {
        toast.error(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required`);
      }
      return false;
    }

    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0]);
      return false;
    }

    return true;
  };

  const handleSaveEditAck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackToEdit) return;
    if (!validateEditForm()) return;

    try {
      await updateAck({
        id: ackToEdit._id,
        clientName: editClientName.trim(),
        institutionName: editInstitutionName.trim(),
        clientEmail: editClientEmail.trim(),
        trainingDate: editTrainingDate.trim(),
        trainersPresentCount: Number(editTrainersCount) || 1,
        traineeNames: editTraineeNames.trim(),
      }).unwrap();
      toast.success('Training acknowledgment updated successfully');
      setAckToEdit(null);
      refetch();
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        (Array.isArray(err?.data?.errors) ? err.data.errors.map((e: any) => e.message || e).join(', ') : null) ||
        err?.message ||
        'Failed to update training acknowledgment';
      toast.error(errorMsg);
    }
  };

  const handleDeleteAck = async () => {
    if (!ackToDelete) return;
    try {
      await deleteAck(ackToDelete._id).unwrap();
      toast.success('Training acknowledgment deleted successfully');
      setAckToDelete(null);
      if (selectedAck?._id === ackToDelete._id) {
        setSelectedAck(null);
      }
      refetch();
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        (Array.isArray(err?.data?.errors) ? err.data.errors.map((e: any) => e.message || e).join(', ') : null) ||
        err?.message ||
        'Failed to delete training acknowledgment';
      toast.error(errorMsg);
    }
  };

  const handleSaveDate = async () => {
    if (!selectedAck || !editDate) return;
    try {
      const res = await updateAckDate({ id: selectedAck._id, trainingDate: editDate }).unwrap();
      toast.success('Training date updated successfully');
      setSelectedAck(res.data);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update training date');
    }
  };

  const resetForm = () => {
    setClientName('');
    setInstitutionName('');
    setTrainingDate(new Date().toISOString().split('T')[0]);
    setTrainersCount(1);
    setTraineeNames('');
    setClientEmail('');
    setSignatureImage(null);
    setTrainingImage(null);
    setFormErrors({});
  };

  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

  const processTrainingPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      const err = 'Please upload a valid image file (JPEG, PNG, WebP)';
      setFormErrors((prev) => ({ ...prev, trainingImage: err }));
      toast.error(err);
      return;
    }
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSizeBytes) {
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const errMsg = `Training session photo exceeds the maximum size limit of 20MB (selected file: ${fileSizeMb}MB). Please upload an image under 20MB.`;
      setFormErrors((prev) => ({
        ...prev,
        trainingImage: `Selected photo is ${fileSizeMb}MB. Maximum allowed size is 20MB.`,
      }));
      toast.error(errMsg, { duration: 5500 });
      return;
    }

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.trainingImage;
      return copy;
    });

    const reader = new FileReader();
    reader.onload = () => {
      setTrainingImage(reader.result as string);
      toast.success('Session photo selected successfully');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    processTrainingPhoto(file);
    e.target.value = '';
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsPhotoDragging(true);
  };

  const handlePhotoDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsPhotoDragging(false);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processTrainingPhoto(e.dataTransfer.files[0]);
    }
  };

  const validateCreateForm = (): boolean => {
    const errs: Record<string, string> = {};
    const missing: string[] = [];

    if (!clientName.trim()) {
      errs.clientName = 'Client Name is required';
      missing.push('Client Name');
    } else if (clientName.trim().length < 2) {
      errs.clientName = 'Client Name must be at least 2 characters';
    }

    if (!institutionName.trim()) {
      errs.institutionName = 'Institution Name is required';
      missing.push('Institution Name');
    } else if (institutionName.trim().length < 2) {
      errs.institutionName = 'Institution Name must be at least 2 characters';
    }

    if (!trainingDate || !trainingDate.trim()) {
      errs.trainingDate = 'Training Date is required';
      missing.push('Training Date');
    }

    if (clientEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail.trim())) {
        errs.clientEmail = 'Please enter a valid email address';
      }
    }

    setFormErrors(errs);

    if (missing.length > 0) {
      if (missing.length === 3) {
        toast.error('Client Name, Institution Name, and Training Date are required');
      } else {
        toast.error(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required`);
      }
      return false;
    }

    if (Object.keys(errs).length > 0) {
      toast.error(Object.values(errs)[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCreateForm()) return;

    try {
      const res = await createAck({
        clientName: clientName.trim(),
        institutionName: institutionName.trim(),
        trainingDate: trainingDate.trim(),
        trainersPresentCount: trainersCount && Number(trainersCount) > 0 ? Number(trainersCount) : 1,
        traineeNames: traineeNames.trim() ? traineeNames.trim() : undefined,
        clientEmail: clientEmail.trim() ? clientEmail.trim() : undefined,
        signatureImage: signatureImage || undefined,
        trainingImage: trainingImage || undefined,
      }).unwrap();

      if (clientEmail.trim()) {
        if (res.emailSent) {
          toast.success('Training Acknowledgment submitted! Email sent to client.');
        } else {
          toast.success('Training Acknowledgment saved successfully!');
          toast.error(res.emailError ? `Email error: ${res.emailError}` : 'Could not deliver email to client.');
        }
      } else {
        toast.success('Training Acknowledgment submitted successfully!');
      }
      resetForm();
      refetch();
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        (Array.isArray(err?.data?.errors) ? err.data.errors.map((e: any) => e.message || e).join(', ') : null) ||
        err?.message ||
        'Failed to submit training acknowledgment. Please verify required fields.';
      toast.error(errorMsg);
    }
  };

  const acknowledgments = data?.data || [];
  const filteredAcks = acknowledgments.filter((ack) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const techName = typeof ack.technicianId === 'object' && ack.technicianId?.name ? ack.technicianId.name.toLowerCase() : '';
    return (
      ack.clientName.toLowerCase().includes(q) ||
      ack.institutionName.toLowerCase().includes(q) ||
      (ack.clientEmail ? ack.clientEmail.toLowerCase().includes(q) : false) ||
      (ack.traineeNames ? ack.traineeNames.toLowerCase().includes(q) : false) ||
      techName.includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Training Acknowledgments</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Create, sign, and monitor all training completion acknowledgments with automatic client email notifications.
            </p>
          </div>
        </div>
      </div>

      {/* 1. TOP: 3 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Acknowledgments</p>
            <p className="text-2xl font-bold text-slate-900">{acknowledgments.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-gold-50 text-gold-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Unique Institutions</p>
            <p className="text-2xl font-bold text-slate-900">
              {new Set(acknowledgments.map((a) => a.institutionName)).size}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Clients Served</p>
            <p className="text-2xl font-bold text-slate-900">
              {new Set(acknowledgments.map((a) => a.clientEmail).filter(Boolean)).size || acknowledgments.length}
            </p>
          </div>
        </Card>
      </div>

      {/* 2. MIDDLE: Training Acknowledgment Form */}
      <Card className="shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            New Training Acknowledgment Entry
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Fill out training completion details. Client email, session photo, and digital signature are optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Institution & Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Client Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3 top-3 ${formErrors.clientName ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none transition ${
                    formErrors.clientName
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                  }`}
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (formErrors.clientName) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.clientName;
                        return copy;
                      });
                    }
                  }}
                />
              </div>
              {formErrors.clientName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.clientName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Institution Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className={`w-4 h-4 absolute left-3 top-3 ${formErrors.institutionName ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="e.g. Delhi Public School"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none transition ${
                    formErrors.institutionName
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                  }`}
                  value={institutionName}
                  onChange={(e) => {
                    setInstitutionName(e.target.value);
                    if (formErrors.institutionName) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.institutionName;
                        return copy;
                      });
                    }
                  }}
                />
              </div>
              {formErrors.institutionName && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.institutionName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Client Email <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${formErrors.clientEmail ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  type="email"
                  placeholder="e.g. principal@dpsschool.org (optional)"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none transition ${
                    formErrors.clientEmail
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                  }`}
                  value={clientEmail}
                  onChange={(e) => {
                    setClientEmail(e.target.value);
                    if (formErrors.clientEmail) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.clientEmail;
                        return copy;
                      });
                    }
                  }}
                />
              </div>
              {formErrors.clientEmail && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.clientEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Training Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className={`w-4 h-4 absolute left-3 top-3 ${formErrors.trainingDate ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  type="date"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none transition ${
                    formErrors.trainingDate
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                  }`}
                  value={trainingDate}
                  onChange={(e) => {
                    setTrainingDate(e.target.value);
                    if (formErrors.trainingDate) {
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.trainingDate;
                        return copy;
                      });
                    }
                  }}
                />
              </div>
              {formErrors.trainingDate && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.trainingDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Trainers Present Count
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min={1}
                  placeholder="1"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={trainersCount}
                  onChange={(e) => setTrainersCount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Trainee Name
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Amit Verma (Physics Dept), Sneha Gupta (Maths Dept) (optional)"
                className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                value={traineeNames}
                onChange={(e) => setTraineeNames(e.target.value)}
              />
            </div>
          </div>

          {/* Media & Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Training Session Photo <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              {trainingImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[180px]">
                  <img
                    src={trainingImage}
                    alt="Training Preview"
                    className="max-h-48 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTrainingImage(null);
                      setFormErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.trainingImage;
                        return copy;
                      });
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <label
                    onDragOver={handlePhotoDragOver}
                    onDragEnter={handlePhotoDragEnter}
                    onDragLeave={handlePhotoDragLeave}
                    onDrop={handlePhotoDrop}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 min-h-[180px] text-center ${
                      isPhotoDragging
                        ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-100 scale-[1.01]'
                        : formErrors.trainingImage
                        ? 'border-rose-400 bg-rose-50/30 hover:border-rose-500 hover:bg-rose-50/50'
                        : 'border-slate-300 hover:border-primary-500 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <Camera className={`w-8 h-8 mb-2 ${
                      isPhotoDragging
                        ? 'text-primary-600 animate-bounce'
                        : formErrors.trainingImage
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`} />
                    <span className={`text-sm font-semibold ${formErrors.trainingImage ? 'text-rose-700' : 'text-slate-700'}`}>
                      {isPhotoDragging ? 'Drop Session Photo Here' : 'Upload Session Photo'}
                    </span>
                    <span className={`text-xs mt-1 ${formErrors.trainingImage ? 'text-rose-500' : 'text-slate-400'}`}>
                      Click to capture or drag & drop PNG/JPG (Max 20MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                  {formErrors.trainingImage && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formErrors.trainingImage}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Digital Signature Pad */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Client Digital Signature <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner p-2">
                <SignatureCanvas
                  value={signatureImage}
                  onSignatureChange={(sig) => setSignatureImage(sig)}
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto sm:min-w-[160px] bg-primary-900 hover:bg-primary-800 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 3. BOTTOM: Records History Table */}
      <Card className="shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <CardTitle>Training Acknowledgment Records ({filteredAcks.length})</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search institution, client, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filteredAcks.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No training acknowledgments found</p>
            <p className="text-xs text-slate-400 mt-1">Submit your first training acknowledgment using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Client Contact</th>
                  <th className="py-3 px-4">Trainee(s)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAcks.map((ack) => (
                  <tr key={ack._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(ack.trainingDate || ack.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {ack.institutionName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{ack.clientName}</div>
                      <div className="text-[11px] text-slate-400">{ack.clientEmail || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ack.traineeNames || 'None specified'}>
                      {ack.traineeNames || <span className="text-slate-400 italic">None specified</span>}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ack)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Acknowledgment"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInspection(ack)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAckToDelete(ack)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Acknowledgment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Inspection Modal */}
      {selectedAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  Training Acknowledgment Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conducted on {formatDate(selectedAck.trainingDate || selectedAck.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAck(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Institution</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedAck.institutionName}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Client Representative</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedAck.clientName}</p>
                  <p className="text-xs text-slate-500">{selectedAck.clientEmail || 'No email provided'}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Training Date</span>
                    {editDate !==
                      (selectedAck.trainingDate
                        ? new Date(selectedAck.trainingDate).toISOString().split('T')[0]
                        : new Date(selectedAck.createdAt).toISOString().split('T')[0]) && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Unsaved
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    {editDate !==
                      (selectedAck.trainingDate
                        ? new Date(selectedAck.trainingDate).toISOString().split('T')[0]
                        : new Date(selectedAck.createdAt).toISOString().split('T')[0]) && (
                        <Button
                          size="sm"
                          disabled={updatingDate}
                          onClick={handleSaveDate}
                          className="h-8 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          {updatingDate ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                        </Button>
                      )}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Conducted By</span>
                  <p className="font-semibold text-slate-900 text-sm mt-1">
                    {typeof selectedAck.technicianId === 'object' && selectedAck.technicianId?.name
                      ? selectedAck.technicianId.name
                      : 'Administrator'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Trainers Present</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedAck.trainersPresentCount || 1}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Submission Timestamp</span>
                  <p className="text-slate-600 text-xs mt-0.5">{formatDate(selectedAck.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Trainee(s)</span>
                  <p className="text-slate-800 text-xs mt-0.5">{selectedAck.traineeNames || <span className="text-slate-400 italic">None specified</span>}</p>
                </div>
              </div>

              {/* Photos & Signature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-xs font-semibold text-slate-600 block mb-2">Training Session Photo</span>
                  {selectedAck.trainingImage ? (
                    <img
                      src={selectedAck.trainingImage}
                      alt="Session Photo"
                      className="max-h-48 mx-auto rounded-lg border border-slate-300 object-contain bg-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-400 py-8">No photo attached</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-xs font-semibold text-slate-600 block mb-2">Client Digital Signature</span>
                  {selectedAck.signatureImage ? (
                    <div className="rounded-xl border border-slate-300 p-4 bg-white flex items-center justify-center min-h-[140px] shadow-sm">
                      <img
                        src={selectedAck.signatureImage}
                        alt="Digital Signature"
                        className="max-h-32 mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-8">No signature captured</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button onClick={() => setSelectedAck(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Acknowledgment Modal */}
      {ackToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-primary-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-800 flex items-center justify-center text-gold-400 shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Edit Training Acknowledgment</h3>
                  <p className="text-xs text-slate-300">Update session and representative details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAckToEdit(null)}
                disabled={updatingAck}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-primary-800 transition disabled:opacity-50"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditAck} noValidate className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution / Organization <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className={`w-4 h-4 absolute left-3 top-2.5 ${editErrors.institutionName ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={editInstitutionName}
                    onChange={(e) => {
                      setEditInstitutionName(e.target.value);
                      if (editErrors.institutionName) {
                        setEditErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.institutionName;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Enter institution name"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition ${
                      editErrors.institutionName
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {editErrors.institutionName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {editErrors.institutionName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Representative Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3 top-2.5 ${editErrors.clientName ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => {
                      setEditClientName(e.target.value);
                      if (editErrors.clientName) {
                        setEditErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.clientName;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Enter representative name"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition ${
                      editErrors.clientName
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {editErrors.clientName && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {editErrors.clientName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Email Address <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${editErrors.clientEmail ? 'text-rose-400' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    value={editClientEmail}
                    onChange={(e) => {
                      setEditClientEmail(e.target.value);
                      if (editErrors.clientEmail) {
                        setEditErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.clientEmail;
                          return copy;
                        });
                      }
                    }}
                    placeholder="client@institution.org"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition ${
                      editErrors.clientEmail
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                    }`}
                  />
                </div>
                {editErrors.clientEmail && (
                  <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {editErrors.clientEmail}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Training Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className={`w-4 h-4 absolute left-3 top-2.5 ${editErrors.trainingDate ? 'text-rose-400' : 'text-slate-400'}`} />
                    <input
                      type="date"
                      value={editTrainingDate}
                      onChange={(e) => {
                        setEditTrainingDate(e.target.value);
                        if (editErrors.trainingDate) {
                          setEditErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.trainingDate;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none bg-white transition ${
                        editErrors.trainingDate
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                          : 'border-slate-300 focus:ring-2 focus:ring-primary-500'
                      }`}
                    />
                  </div>
                  {editErrors.trainingDate && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" /> {editErrors.trainingDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trainers Count <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min={1}
                      required
                      value={editTrainersCount}
                      onChange={(e) => setEditTrainersCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trainee Name(s) <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={editTraineeNames}
                  onChange={(e) => setEditTraineeNames(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma, Priya Patel"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAckToEdit(null)}
                  disabled={updatingAck}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingAck}
                  className="bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold px-4 flex items-center gap-1.5 shadow-sm"
                >
                  {updatingAck ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Acknowledgment Confirmation Modal */}
      {ackToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Delete Training Acknowledgment</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete the training record for{' '}
              <span className="font-semibold text-slate-900">{ackToDelete.institutionName}</span> ({ackToDelete.clientName})?
              This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAckToDelete(null)}
                disabled={deletingAck}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteAck}
                disabled={deletingAck}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {deletingAck ? 'Deleting...' : 'Delete Acknowledgment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
