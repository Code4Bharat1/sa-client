'use client';

import { useState } from 'react';
import {
  useGetClientsQuery,
  useDeleteClientMutation,
  ClientItem,
} from '@/store/api/clientsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BackButton } from '@/components/ui/BackButton';
import { AddClientModal } from '@/components/admin/AddClientModal';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Contact,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  Eye,
  Trash2,
  X,
  Plus,
  Pencil,
  Layers,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function AdminClientsPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientItem | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientItem | null>(null);

  // Fetch clients from clients API (deliveries removed)
  const { data, isLoading } = useGetClientsQuery({
    search: search.trim() || undefined,
  });

  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();

  const clientRecords = data?.data || [];

  // KPIs
  const totalClients = clientRecords.length;
  const clientsWithPanels = clientRecords.filter((c) => Boolean(c.panelInfo && c.panelInfo.trim())).length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const addedThisMonth = clientRecords.filter((c) => {
    try {
      const d = new Date(c.createdAt || c.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch {
      return false;
    }
  }).length;

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete._id).unwrap();
      toast.success('Client deleted successfully');
      setClientToDelete(null);
      if (selectedClient?._id === clientToDelete._id) {
        setSelectedClient(null);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete client');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Contact className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-mono flex items-center gap-2">
                Clients
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Directory of registered clients, addresses, dates, and panel information
              </p>
            </div>
          </div>

          {/* Add Client Button on Top Right */}
          <Button
            onClick={() => {
              setClientToEdit(null);
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto bg-primary-900 hover:bg-primary-800 text-white flex items-center justify-center gap-2 shadow-sm text-xs font-semibold px-4 py-2"
          >
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-xs hover:shadow transition-shadow">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Clients</p>
            <p className="text-xl font-bold text-slate-900">{totalClients}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-xs hover:shadow transition-shadow">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Added This Month</p>
            <p className="text-xl font-bold text-slate-900">{addedThisMonth}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-xs hover:shadow transition-shadow">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">With Panel Details</p>
            <p className="text-xl font-bold text-slate-900">{clientsWithPanels}</p>
          </div>
        </Card>
      </div>

      {/* Client Records Table */}
      <Card className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Client List</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {clientRecords.length}
            </span>
          </CardTitle>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, email, phone, panel info..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <Spinner className="py-16" />
        ) : clientRecords.length === 0 ? (
          <div className="text-center py-16 px-4 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Contact className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No client records found.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search
                ? `No clients matching "${search}". Try refining your search query.`
                : 'Click the "Add Client" button on the top right to create your first client record.'}
            </p>
            {!search && (
              <Button
                onClick={() => setShowAddModal(true)}
                size="sm"
                className="mt-4 bg-primary-900 hover:bg-primary-800 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Client
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">Sr. No.</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Panel Info</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {clientRecords.map((item, index) => {
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Sr. No. */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      {/* 2. Client Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.clientName?.[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {item.clientName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs">{item.clientEmail}</span>
                        </div>
                      </td>

                      {/* 4. Mobile Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-xs">{item.clientMobile}</span>
                        </div>
                      </td>

                      {/* 5. Address */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-1.5 text-slate-600 max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate block" title={item.address}>
                            {item.address}
                          </span>
                        </div>
                      </td>

                      {/* 6. Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-xs">{item.date}</span>
                        </div>
                      </td>

                      {/* 7. Panel Info */}
                      <td className="py-3 px-4">
                        {item.panelInfo ? (
                          <div
                            className="max-w-xs truncate text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[11px] inline-block font-mono cursor-pointer transition-colors"
                            onClick={() => setSelectedClient(item)}
                            title={item.panelInfo}
                          >
                            {item.panelInfo}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No panel info</span>
                        )}
                      </td>

                      {/* 8. Actions: Edit, View, Delete (matching Image 2) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setClientToEdit(item);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Client"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedClient(item)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                            title="View Client Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setClientToDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* POPUP / MODAL: Add / Edit Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        clientToEdit={clientToEdit}
        onClose={() => {
          setShowAddModal(false);
          setClientToEdit(null);
        }}
      />

      {/* POPUP / MODAL: View Client Profile */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-primary-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center text-gold-400">
                  <Contact className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedClient.clientName}</h3>
                  <p className="text-[11px] text-slate-300">Client Profile & Panel Details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-primary-800 transition"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
              {/* Contact Information */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Email Address</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 break-all">
                      {selectedClient.clientEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Mobile Number</p>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {selectedClient.clientMobile}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  Address
                </h4>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedClient.address}
                </p>
              </div>

              {/* Date */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-600" />
                  Date
                </h4>
                <p className="text-xs font-bold text-slate-800 bg-white p-3 rounded-lg border border-slate-100">
                  {selectedClient.date}
                </p>
              </div>

              {/* Panel Info */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary-600" />
                  Panel Information
                </h4>
                {selectedClient.panelInfo ? (
                  <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-100 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedClient.panelInfo}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-slate-100">
                    No panel details entered.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Created on {formatDate(selectedClient.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const client = selectedClient;
                    setSelectedClient(null);
                    setClientToEdit(client);
                    setShowAddModal(true);
                  }}
                  className="text-xs px-3 font-semibold flex items-center gap-1.5 border-slate-300 hover:bg-slate-100"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedClient(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-5 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Delete Client</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to delete client{' '}
              <span className="font-semibold text-slate-900">{clientToDelete.clientName}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
