'use client';
import { useState } from 'react';
import { useGetAcknowledgmentsQuery, useCreateAcknowledgmentMutation } from '@/store/api/acknowledgmentsApi';
import { SignatureCanvas } from '@/components/shared/SignatureCanvas';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FileCheck, Mail, Building, User, Users, CheckCircle, Search } from 'lucide-react';

export default function TechnicianAcknowledgmentsPage() {
  const { data, isLoading, refetch } = useGetAcknowledgmentsQuery();
  const [createAck, { isLoading: submitting }] = useCreateAcknowledgmentMutation();

  const [clientName, setClientName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [trainersCount, setTrainersCount] = useState<number | ''>(1);
  const [traineeNames, setTraineeNames] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAck, setSelectedAck] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) { toast.error('Client Name is required'); return; }
    if (!institutionName.trim()) { toast.error('Institution Name is required'); return; }
    if (!trainersCount || Number(trainersCount) <= 0) { toast.error('Please enter a valid number of trainers'); return; }
    if (!traineeNames.trim()) { toast.error('Trainee Name(s) are required'); return; }
    if (!clientEmail.trim()) { toast.error('Client Email is required'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) { toast.error('Please enter a valid email address'); return; }
    if (!signatureImage) { toast.error('Please capture digital signature on the pad'); return; }

    try {
      await createAck({
        clientName: clientName.trim(),
        institutionName: institutionName.trim(),
        trainersPresentCount: Number(trainersCount),
        traineeNames: traineeNames.trim(),
        clientEmail: clientEmail.trim(),
        signatureImage,
      }).unwrap();

      toast.success('Training Acknowledgment submitted! Email sent to client.');
      setClientName('');
      setInstitutionName('');
      setTrainersCount(1);
      setTraineeNames('');
      setClientEmail('');
      setSignatureImage(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit training acknowledgment');
    }
  };

  const acknowledgments = data?.data || [];
  const filteredAcks = acknowledgments.filter((ack) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ack.clientName.toLowerCase().includes(q) ||
      ack.institutionName.toLowerCase().includes(q) ||
      ack.clientEmail.toLowerCase().includes(q) ||
      ack.traineeNames.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="p-2.5 bg-primary-800 text-gold-400 rounded-xl shadow-sm">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-mono">Training Acknowledgment Form</h1>
          <p className="text-sm text-slate-500">Fill out training completion details and capture client signature to automatically dispatch confirmation email.</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-sm border border-slate-200">
          <CardTitle className="mb-4 flex items-center gap-2 text-slate-900">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            New Acknowledgment Entry
          </CardTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Client Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Institution Name *</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Engineering College"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">No. of Trainers Present *</label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="1"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={trainersCount}
                    onChange={(e) => setTrainersCount(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Client Email (For Delivery) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="client@institution.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Trainee Name(s) *</label>
              <textarea
                rows={2}
                required
                placeholder="Enter names of trainees who attended the training..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                value={traineeNames}
                onChange={(e) => setTraineeNames(e.target.value)}
              />
            </div>

            {/* Signature Canvas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Client Digital Signature *</label>
              <SignatureCanvas value={signatureImage} onSignatureChange={setSignatureImage} />
            </div>

            <Button type="submit" loading={submitting} className="w-full py-2.5 mt-2">
              <FileCheck className="w-4 h-4 mr-2" /> Submit & Send Email to Client
            </Button>
          </form>
        </Card>

      {/* Submitted Acknowledgments Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <CardTitle>Submitted Acknowledgments ({filteredAcks.length})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search acknowledgments..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner className="py-8" />
        ) : filteredAcks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No training acknowledgments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Client Name</th>
                  <th className="px-4 py-3">Client Email</th>
                  <th className="px-4 py-3">Trainers</th>
                  <th className="px-4 py-3">Submitted At</th>
                  <th className="px-4 py-3 text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAcks.map((ack) => (
                  <tr key={ack._id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedAck(ack)}>
                    <td className="px-4 py-3 font-medium text-slate-900">{ack.institutionName}</td>
                    <td className="px-4 py-3">{ack.clientName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{ack.clientEmail}</td>
                    <td className="px-4 py-3">{ack.trainersPresentCount}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(ack.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                        Captured
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Detail Viewer */}
      {selectedAck && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAck(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Training Acknowledgment Details</h3>
              <button onClick={() => setSelectedAck(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-slate-500 uppercase">Institution</dt><dd className="font-semibold text-slate-900">{selectedAck.institutionName}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Client Name</dt><dd className="font-semibold text-slate-900">{selectedAck.clientName}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Client Email</dt><dd className="font-mono text-xs">{selectedAck.clientEmail}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Trainers Present</dt><dd>{selectedAck.trainersPresentCount}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500 uppercase">Trainees</dt><dd className="bg-slate-50 p-2 rounded text-xs text-slate-700 mt-1">{selectedAck.traineeNames}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-slate-500 uppercase">Submitted At</dt><dd className="text-xs">{formatDate(selectedAck.createdAt)}</dd></div>
            </dl>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Digital Signature</p>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex justify-center shadow-inner">
                <img src={selectedAck.signatureImage} alt="Digital Signature" className="max-h-32 object-contain" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedAck(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
