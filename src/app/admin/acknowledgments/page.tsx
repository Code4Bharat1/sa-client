'use client';
import { useState } from 'react';
import { useGetAcknowledgmentsQuery } from '@/store/api/acknowledgmentsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { FileCheck, Search, Shield, Building, User, Mail, Calendar, Eye, ImageIcon } from 'lucide-react';

export default function AdminAcknowledgmentsPage() {
  const { data, isLoading } = useGetAcknowledgmentsQuery();
  const [search, setSearch] = useState('');
  const [selectedAck, setSelectedAck] = useState<any | null>(null);

  const acknowledgments = data?.data || [];

  const filteredAcks = acknowledgments.filter((ack) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const techName = typeof ack.technicianId === 'object' ? ack.technicianId.name.toLowerCase() : '';
    return (
      ack.clientName.toLowerCase().includes(q) ||
      ack.institutionName.toLowerCase().includes(q) ||
      ack.clientEmail.toLowerCase().includes(q) ||
      ack.traineeNames.toLowerCase().includes(q) ||
      techName.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-mono">Training Acknowledgments Master View</h1>
          <p className="text-sm text-slate-500">Monitor and inspect all training completion acknowledgments submitted by field technicians.</p>
        </div>
      </div>

      {/* KPI Cards */}
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
              {new Set(acknowledgments.map(a => a.institutionName)).size}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Technicians</p>
            <p className="text-2xl font-bold text-slate-900">
              {new Set(acknowledgments.map(a => typeof a.technicianId === 'object' ? a.technicianId._id : a.technicianId)).size}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <CardTitle>Training Acknowledgment Records ({filteredAcks.length})</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search institution, client, technician..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : filteredAcks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No training acknowledgments found matching search criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Client Representative</th>
                  <th className="px-4 py-3">Client Email</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Submitted At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAcks.map((ack) => {
                  const tech = typeof ack.technicianId === 'object' ? ack.technicianId : null;
                  return (
                    <tr key={ack._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{ack.institutionName}</td>
                      <td className="px-4 py-3">{ack.clientName}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{ack.clientEmail}</td>
                      <td className="px-4 py-3 font-medium text-indigo-700">{tech ? tech.name : '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(ack.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAck(ack)}
                          className="h-7 text-xs flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> View Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admin Inspection Modal */}
      {selectedAck && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAck(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Training Acknowledgment Record
              </h3>
              <button onClick={() => setSelectedAck(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Institution</dt>
                <dd className="font-bold text-slate-900 mt-0.5">{selectedAck.institutionName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Client Representative</dt>
                <dd className="font-bold text-slate-900 mt-0.5">{selectedAck.clientName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Client Email</dt>
                <dd className="font-mono text-xs text-slate-700 mt-0.5">{selectedAck.clientEmail}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Trainers Present</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{selectedAck.trainersPresentCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Submitted By Technician</dt>
                <dd className="font-medium text-indigo-700 mt-0.5">
                  {typeof selectedAck.technicianId === 'object' ? selectedAck.technicianId.name : 'Technician'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 uppercase font-semibold">Submission Date</dt>
                <dd className="text-xs text-slate-700 mt-0.5">{formatDate(selectedAck.createdAt)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-500 uppercase font-semibold">Trainee Names</dt>
                <dd className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed border border-slate-200">
                  {selectedAck.traineeNames}
                </dd>
              </div>
            </dl>

            {selectedAck.trainingImage && (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Training Session Photo
                </p>
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex justify-center shadow-inner">
                  <img src={selectedAck.trainingImage} alt="Training Session Photo" className="max-h-52 object-contain rounded-lg" />
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Client Digital Signature Proof</p>
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex justify-center shadow-inner">
                <img src={selectedAck.signatureImage} alt="Digital Signature" className="max-h-36 object-contain" />
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
