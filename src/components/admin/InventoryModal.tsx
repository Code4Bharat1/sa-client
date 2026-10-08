'use client';
import React, { useState, useEffect } from 'react';
import { PanelInventory } from '@/types';
import {
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
} from '@/store/api/inventoryApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { X, Loader2, Store, Monitor, UserCheck } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: PanelInventory | null;
  onSuccess: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const isEditing = Boolean(item);

  const [createInventory, { isLoading: isCreating }] = useCreateInventoryMutation();
  const [updateInventory, { isLoading: isUpdating }] = useUpdateInventoryMutation();
  const isSubmitting = isCreating || isUpdating;

  // 1. Vendor Details
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState('');

  // 2. Panel Details
  const [panelSerialNumber, setPanelSerialNumber] = useState('');
  const [panelBrand, setPanelBrand] = useState('');
  const [panelSize, setPanelSize] = useState('75"');
  const [warrantyPeriod, setWarrantyPeriod] = useState('3 Years');

  // 3. Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerOrganization, setCustomerOrganization] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [saleInvoiceNo, setSaleInvoiceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  // Helper to get local date string YYYY-MM-DD
  const getTodayLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (item && isOpen) {
      setVendorName(item.vendorName || '');
      setVendorEmail(item.vendorEmail || '');
      setVendorPhone(item.vendorPhone || '');
      setPurchaseDate(item.purchaseDate || '');
      setPurchaseInvoiceNo(item.purchaseInvoiceNo || '');

      setPanelSerialNumber(item.panelSerialNumber || '');
      setPanelBrand(item.panelBrand || '');
      setPanelSize(item.panelSize || '75"');
      setWarrantyPeriod(item.warrantyPeriod || '3 Years');

      setCustomerName(item.customerName || '');
      setCustomerEmail(item.customerEmail || '');
      setCustomerPhone(item.customerPhone || '');
      setCustomerOrganization(item.customerOrganization || '');
      setSaleDate(item.saleDate || '');
      setSaleInvoiceNo(item.saleInvoiceNo || '');
      setRemarks(item.remarks || '');
    } else if (!item && isOpen) {
      resetForm();
    }
  }, [item, isOpen]);

  const resetForm = () => {
    const today = getTodayLocalDate();
    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
    setPurchaseDate(today);
    setPurchaseInvoiceNo('');

    setPanelSerialNumber('');
    setPanelBrand('');
    setPanelSize('75"');
    setWarrantyPeriod('3 Years');

    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerOrganization('');
    setSaleDate(today);
    setSaleInvoiceNo('');
    setRemarks('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!vendorName.trim()) {
      toast.error('Please enter the vendor name');
      return;
    }
    if (!panelSerialNumber.trim()) {
      toast.error('Please enter the panel serial number');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter the customer name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (vendorEmail.trim() && !emailRegex.test(vendorEmail.trim())) {
      toast.error('Please enter a valid vendor email address');
      return;
    }
    if (customerEmail.trim() && !emailRegex.test(customerEmail.trim())) {
      toast.error('Please enter a valid customer email address');
      return;
    }

    const cleanSerial = panelSerialNumber.trim().toUpperCase();

    const payload = {
      vendorName: vendorName.trim(),
      vendorEmail: vendorEmail.trim(),
      vendorPhone: vendorPhone.trim(),
      purchaseDate: purchaseDate.trim(),
      purchaseInvoiceNo: purchaseInvoiceNo.trim(),

      panelSerialNumber: cleanSerial,
      panelBrand: panelBrand.trim(),
      panelSize: panelSize.trim(),
      warrantyPeriod: warrantyPeriod.trim(),

      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerOrganization: customerOrganization.trim(),
      saleDate: saleDate.trim(),
      saleInvoiceNo: saleInvoiceNo.trim(),
      remarks: remarks.trim(),
    };

    try {
      if (isEditing && item) {
        await updateInventory({ id: item._id, ...payload }).unwrap();
        toast.success('Panel record updated successfully');
      } else {
        await createInventory(payload).unwrap();
        toast.success(`Panel ${payload.panelSerialNumber} registered successfully`);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Failed to save panel inventory record';
      toast.error(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary-600" />
              {isEditing ? 'Edit Panel & Sales Record' : 'Register Panel Purchase & Sale'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record purchase from vendor and subsequent dispatch/sale to customer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
          {/* SECTION 1: VENDOR DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80">
              <Store className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Vendor Details (Purchase Info)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <Input
                  id="vendorName"
                  label="Vendor / Supplier Name *"
                  placeholder="e.g. Maxhub India, ViewSonic, Local Distributor"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  id="vendorEmail"
                  label="Vendor Email"
                  type="email"
                  placeholder="vendor@company.com"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="vendorPhone"
                  label="Vendor Phone Number"
                  placeholder="e.g. +91 9876543210"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="purchaseDate"
                  label="Purchase Date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  id="purchaseInvoiceNo"
                  label="Purchase Invoice / Bill No."
                  placeholder="e.g. INV-VENDOR-2026-081"
                  value={purchaseInvoiceNo}
                  onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PANEL HARDWARE DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80">
              <Monitor className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Panel Hardware Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/40 rounded-xl border border-blue-200/70">
              <div>
                <Input
                  id="panelSerialNumber"
                  label="Panel Serial Number *"
                  placeholder="e.g. IFPD-2026-9921"
                  value={panelSerialNumber}
                  onChange={(e) => setPanelSerialNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div>
                <Input
                  id="panelBrand"
                  label="Brand / Make"
                  placeholder="e.g. Maxhub V6, ViewSonic IFP, Samsung"
                  value={panelBrand}
                  onChange={(e) => setPanelBrand(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="panelSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Panel Screen Size
                </label>
                <select
                  id="panelSize"
                  value={panelSize}
                  onChange={(e) => setPanelSize(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value='55"'>55 inch</option>
                  <option value='65"'>65 inch</option>
                  <option value='75"'>75 inch</option>
                  <option value='86"'>86 inch</option>
                  <option value='98"'>98 inch</option>
                  <option value='110"'>110 inch</option>
                  {!['55"', '65"', '75"', '86"', '98"', '110"'].includes(panelSize) && panelSize && (
                    <option value={panelSize}>{panelSize}</option>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="warrantyPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Period
                </label>
                <select
                  id="warrantyPeriod"
                  value={warrantyPeriod}
                  onChange={(e) => setWarrantyPeriod(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="1 Year">1 Year Standard</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years Comprehensive</option>
                  <option value="5 Years">5 Years Extended</option>
                  <option value="Expired / None">No Warranty / Expired</option>
                  {!['1 Year', '2 Years', '3 Years', '5 Years', 'Expired / None'].includes(warrantyPeriod) && warrantyPeriod && (
                    <option value={warrantyPeriod}>{warrantyPeriod}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: SOLD TO CUSTOMER DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80">
              <UserCheck className="w-4 h-4 text-primary-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Sold To Customer Details (Sales Info)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <Input
                  id="customerName"
                  label="Customer / Buyer Name *"
                  placeholder="e.g. Prof. Rajesh Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Input
                  id="customerEmail"
                  label="Customer Email ID"
                  type="email"
                  placeholder="customer@school.edu"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="customerPhone"
                  label="Customer Mobile / Phone"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="customerOrganization"
                  label="School / Institution / Org Name"
                  placeholder="e.g. DPS International, Apex Academy"
                  value={customerOrganization}
                  onChange={(e) => setCustomerOrganization(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="saleDate"
                  label="Selling / Installation Date"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>
              <div>
                <Input
                  id="saleInvoiceNo"
                  label="Sales Invoice / Receipt No."
                  placeholder="e.g. SALE-2026-442"
                  value={saleInvoiceNo}
                  onChange={(e) => setSaleInvoiceNo(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  id="remarks"
                  label="Remarks / Notes (Optional)"
                  placeholder="e.g. Delivered with 2 magnetic pens, wall mount included"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Save Panel Record'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
