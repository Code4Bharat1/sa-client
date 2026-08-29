'use client';
import React, { useState } from 'react';
import { useGetAcknowledgmentsQuery, useCreateAcknowledgmentMutation } from '@/store/api/acknowledgmentsApi';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
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
} from 'lucide-react';

export default function AdminAcknowledgmentsPage() {
  const { data, isLoading, refetch } = useGetAcknowledgmentsQuery();
  const [createAck, { isLoading: submitting }] = useCreateAcknowledgmentMutation();

  // Form State
  const [clientName, setClientName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [trainersCount, setTrainersCount] = useState<number | ''>(1);
  const [traineeNames, setTraineeNames] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [trainingImage, setTrainingImage] = useState<string | null>(null);

  // Search & Modal State
  const [search, setSearch] = useState('');
  const [selectedAck, setSelectedAck] = useState<any | null>(null);

  const resetForm = () => {
    setClientName('');
    setInstitutionName('');
    setTrainersCount(1);
    setTraineeNames('');
    setClientEmail('');
    setSignatureImage(null);
    setTrainingImage(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image size must be under 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTrainingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) { toast.error('Client Name is required'); return; }
    if (!institutionName.trim()) { toast.error('Institution Name is required'); return; }
    if (!trainersCount || Number(trainersCount) <= 0) { toast.error('Please enter a valid number of trainers'); return; }
    if (!traineeNames.trim()) { toast.error('Trainee Name(s) are required'); return; }
    if (!clientEmail.trim()) { toast.error('Client Email is required'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) { toast.error('Please enter a valid email address'); return; }
    if (!trainingImage) { toast.error('Please upload a training session photo'); return; }
    if (!signatureImage) { toast.error('Please capture digital signature on the pad'); return; }

    try {
      await createAck({
        clientName: clientName.trim(),
        institutionName: institutionName.trim(),
        trainersPresentCount: Number(trainersCount),
        traineeNames: traineeNames.trim(),
        clientEmail: clientEmail.trim(),
        signatureImage,
        trainingImage,
      }).unwrap();

      toast.success('Training Acknowledgment submitted! Email sent to client.');
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit training acknowledgment');
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
      ack.clientEmail.toLowerCase().includes(q) ||
      ack.traineeNames.toLowerCase().includes(q) ||
      techName.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Portal</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-mono">Training Acknowledgments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create, sign, and monitor all training completion acknowledgments with automatic client email notifications.
        </p>
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
              {new Set(acknowledgments.map((a) => a.clientEmail)).size}
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
            Fill out training completion details and capture client signature to automatically dispatch confirmation email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institution & Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Client Representative Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Institution / School Name *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi Public School"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Client Email (Receives PDF / Confirmation) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@dpsschool.org"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Trainers Present Count *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 2"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  value={trainersCount}
                  onChange={(e) => setTrainersCount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Trainee Name(s) *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Amit Verma (Physics Dept), Sneha Gupta (Maths Dept)"
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
                Training Session Photo *
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
                    onClick={() => setTrainingImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition min-h-[180px]">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-slate-700">Upload Session Photo</span>
                  <span className="text-xs text-slate-400 mt-1">Click to capture or upload PNG/JPG (Max 20MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>

            {/* Digital Signature Pad */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Client Digital Signature *
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAcks.map((ack) => (
                  <tr key={ack._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(ack.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {ack.institutionName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{ack.clientName}</div>
                      <div className="text-[11px] text-slate-400">{ack.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ack.traineeNames}>
                      {ack.traineeNames}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAck(ack)}
                        className="text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
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
                  Conducted on {formatDate(selectedAck.createdAt)}
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
                  <p className="text-xs text-slate-500">{selectedAck.clientEmail}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Trainers Present</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedAck.trainersPresentCount}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Conducted By</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">
                    {typeof selectedAck.technicianId === 'object' && selectedAck.technicianId?.name
                      ? selectedAck.technicianId.name
                      : 'Administrator'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Trainee(s)</span>
                  <p className="text-slate-800 text-xs mt-0.5">{selectedAck.traineeNames}</p>
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
    </div>
  );
}
