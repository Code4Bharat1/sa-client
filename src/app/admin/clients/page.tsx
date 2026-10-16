'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useGetDeliveriesQuery,
  DeliveryItem,
  DeliveryStatus,
} from '@/store/api/deliveriesApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { BackButton } from '@/components/ui/BackButton';
import { formatDate } from '@/lib/utils';
import {
  Contact,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  Eye,
  Truck,
  Shield,
  RefreshCw,
  X,
  Plus,
  ArrowRight,
  Building2,
  Sparkles,
} from 'lucide-react';

const STATUS_COLORS: Record<DeliveryStatus, { bg: string; text: string; border: string }> = {
  Scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Dispatched: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Out for Delivery': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function AdminClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClient, setSelectedClient] = useState<DeliveryItem | null>(null);

  // Fetch dynamic deliveries data
  const { data, isLoading } = useGetDeliveriesQuery({
    search: search.trim() || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  });

  const clientRecords = data?.data || [];

  // KPIs
  const totalClients = clientRecords.length;
  const deliveredCount = clientRecords.filter((d) => d.status === 'Delivered').length;
  const inTransitCount = clientRecords.filter(
    (d) => d.status === 'Out for Delivery' || d.status === 'Dispatched'
  ).length;
  const scheduledCount = clientRecords.filter((d) => d.status === 'Scheduled').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <BackButton />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Contact className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-mono flex items-center gap-2">
                Client History
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Detailed history of registered clients, assigned delivery agents, and panel deliveries
              </p>
            </div>
          </div>

          <Link href="/admin/deliveries">
            <Button className="w-full sm:w-auto bg-primary-900 hover:bg-primary-800 text-white flex items-center gap-1.5 shadow-sm text-xs font-semibold">
              <Plus className="w-4 h-4" /> Add Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-sm hover:shadow transition-shadow">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Clients</p>
            <p className="text-xl font-bold text-slate-900">{totalClients}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-sm hover:shadow transition-shadow">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Scheduled</p>
            <p className="text-xl font-bold text-slate-900">{scheduledCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-sm hover:shadow transition-shadow">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Transit</p>
            <p className="text-xl font-bold text-slate-900">{inTransitCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white shadow-sm hover:shadow transition-shadow">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Delivered</p>
            <p className="text-xl font-bold text-slate-900">{deliveredCount}</p>
          </div>
        </Card>
      </div>

      {/* Client Records Table */}
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Client List</span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
              {clientRecords.length}
            </span>
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              className="w-full sm:w-44 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <Spinner className="py-16" />
        ) : clientRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Contact className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No client records found.</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a new delivery order to populate the client history.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Sr. No.</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone No</th>
                  <th className="py-3 px-4 text-center">Actions</th>
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

                      {/* 2. Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {item.customerName[0]?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {item.customerName}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Package className="w-3 h-3 text-slate-400" /> {item.productName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs">{item.customerEmail}</span>
                        </div>
                      </td>

                      {/* 4. Phone No */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-xs">{item.customerPhone}</span>
                        </div>
                      </td>

                      {/* 5. View More Button */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedClient(item)}
                          className="text-xs inline-flex items-center gap-1.5 py-1 px-3 border-primary-300 text-primary-800 hover:bg-primary-50 hover:border-primary-500 shadow-xs font-semibold rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary-600" />
                          <span>View More</span>
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

      {/* POPUP / MODAL: Section-wise Client Details */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-800/80 flex items-center justify-center text-gold-400">
                  <Contact className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Client & Delivery Profile</h3>
                  <p className="text-[11px] text-slate-400">Complete details partitioned by section</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Partitioned Sections */}
            <div className="p-6 space-y-6 text-sm overflow-y-auto flex-1">
              {/* SECTION 1: Client Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="p-1 rounded bg-blue-100 text-blue-700">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Client Details Section
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Client Name</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedClient.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Email Address</p>
                    <p className="font-medium text-slate-700 text-xs mt-0.5 break-all">
                      {selectedClient.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Phone Number</p>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {selectedClient.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Delivery Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-purple-100 text-purple-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Delivery Section
                    </h4>
                  </div>
                  {/* Delivery Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      STATUS_COLORS[selectedClient.status]?.bg || 'bg-slate-100'
                    } ${STATUS_COLORS[selectedClient.status]?.text || 'text-slate-700'} ${
                      STATUS_COLORS[selectedClient.status]?.border || 'border-slate-200'
                    }`}
                  >
                    {selectedClient.status}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Delivery Address</p>
                    <p className="font-medium text-slate-800 text-xs mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                      {selectedClient.address}
                    </p>
                    {selectedClient.googleMapLink && (
                      <a
                        href={selectedClient.googleMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-semibold mt-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Open Navigation on Google Maps{' '}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-100">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Delivery Date</p>
                        <p className="text-xs font-bold text-slate-800">{selectedClient.deliveryDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-100">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Estimated Time (ETA)</p>
                        <p className="text-xs font-bold text-slate-800">{selectedClient.estimateTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Products Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="p-1 rounded bg-amber-100 text-amber-700">
                    <Package className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Products Section
                  </h4>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Product Name</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" />
                    <span>{selectedClient.productName}</span>
                  </p>
                </div>
              </div>

              {/* SECTION 4: Agent Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Agent Section
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Agent Name</p>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">
                      {selectedClient.deliveryAgentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Agent Phone</p>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {selectedClient.deliveryAgentPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Agent Email</p>
                    <p className="font-medium text-slate-700 text-xs mt-0.5 break-all">
                      {selectedClient.deliveryAgentEmail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-slate-400">
                Created on {formatDate(selectedClient.createdAt)}
              </span>
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
      )}
    </div>
  );
}
