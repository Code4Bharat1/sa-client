'use client';
import { useState } from 'react';
import {
  useGetInventoryQuery,
  useDeleteInventoryMutation,
} from '@/store/api/inventoryApi';
import { PanelInventory } from '@/types';
import { InventoryModal } from '@/components/admin/InventoryModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Monitor,
  Store,
  UserCheck,
  Edit2,
  Trash2,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PanelInventory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetInventoryQuery({
    search: search.trim() || undefined,
    page,
    limit: 25,
  });

  const [deleteInventory, { isLoading: isDeleting }] = useDeleteInventoryMutation();

  const items = data?.data?.items || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PanelInventory) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, serial: string) => {
    if (!window.confirm(`Are you sure you want to delete panel record "${serial}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteInventory(id).unwrap();
      toast.success(`Panel ${serial} deleted successfully`);
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Failed to delete panel record';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Panel Inventory & Sales
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track vendor purchase origins, panel hardware serial numbers, and customer sales.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Register New Panel
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Panels Tracked</p>
            <p className="text-xl font-bold text-slate-800">{total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Vendor Purchases</p>
            <p className="text-xl font-bold text-slate-800">
              {new Set(items.map((i) => i.vendorName)).size} Unique Vendors
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Customer Dispatches</p>
            <p className="text-xl font-bold text-slate-800">
              {new Set(items.map((i) => i.customerName)).size} Customers
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white placeholder-slate-400 shadow-sm"
            placeholder="Search by serial number, vendor, customer, school..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <Spinner className="py-20" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Panel Serial & Spec
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Purchased From (Vendor)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Sold To (Customer)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Sale Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Warranty
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Monitor className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-500">
                          {search ? 'No panel records matched your search.' : 'No panel inventory records registered yet.'}
                        </p>
                        {!search && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="mt-2"
                          >
                            + Register Your First Panel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Panel Serial No */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded w-fit border border-primary-100">
                            {item.panelSerialNumber}
                          </span>
                          <span className="text-xs text-slate-600 mt-1">
                            {item.panelBrand || 'IFPD'} {item.panelSize ? `• ${item.panelSize}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Vendor Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            {item.vendorName}
                          </span>
                          {item.vendorEmail && (
                            <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                              {item.vendorEmail}
                            </span>
                          )}
                          {item.purchaseDate && (
                            <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Purchased: {item.purchaseDate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            {item.customerName}
                          </span>
                          {item.customerOrganization && (
                            <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                              <Building className="w-3 h-3 text-slate-400" />
                              {item.customerOrganization}
                            </span>
                          )}
                          {item.customerPhone && (
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              {item.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sale Date */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {item.saleDate || '—'}
                      </td>

                      {/* Warranty */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {item.warrantyPeriod || 'Standard'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-primary-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.panelSerialNumber)}
                            disabled={isDeleting && deletingId === item._id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({total} total panels)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={editingItem}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
