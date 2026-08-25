'use client';
import { useState, useRef } from 'react';
import {
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useUpdateDeliveryMutation,
  useUpdateDeliveryStatusMutation,
  useResendDeliveryWhatsAppMutation,
  useDeleteDeliveryMutation,
  DeliveryItem,
  DeliveryStatus,
} from '@/store/api/deliveriesApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Eye,
  PlusCircle,
  Shield,
  RefreshCw,
  X,
  MessageCircle,
  SendHorizontal,
  Pencil,
} from 'lucide-react';

const STATUS_COLORS: Record<DeliveryStatus, { bg: string; text: string; border: string }> = {
  Scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Dispatched: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Out for Delivery': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function AdminDeliveriesPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryItem | null>(null);

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [productName, setProductName] = useState('');
  const [deliveryAgentName, setDeliveryAgentName] = useState('');
  const [deliveryAgentPhone, setDeliveryAgentPhone] = useState('');
  const [deliveryAgentEmail, setDeliveryAgentEmail] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimateTime, setEstimateTime] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('Scheduled');

  // Form Validation Errors State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // API Hooks
  const { data, isLoading, refetch } = useGetDeliveriesQuery({
    search: search.trim() || undefined,
    status: statusFilter !== 'All' ? statusFilter : undefined,
  });
  const [createDelivery, { isLoading: isCreating }] = useCreateDeliveryMutation();
  const [updateDelivery, { isLoading: isUpdating }] = useUpdateDeliveryMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateDeliveryStatusMutation();
  const [resendWhatsApp, { isLoading: isResending }] = useResendDeliveryWhatsAppMutation();
  const [deleteDelivery, { isLoading: isDeleting }] = useDeleteDeliveryMutation();

  const deliveries = data?.data || [];

  // KPIs
  const totalCount = deliveries.length;
  const outForDeliveryCount = deliveries.filter((d) => d.status === 'Out for Delivery' || d.status === 'Dispatched').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'Delivered').length;
  const scheduledCount = deliveries.filter((d) => d.status === 'Scheduled').length;

  const resetForm = () => {
    setEditingId(null);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddress('');
    setGoogleMapLink('');
    setProductName('');
    setDeliveryAgentName('');
    setDeliveryAgentPhone('');
    setDeliveryAgentEmail('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setEstimateTime('');
    setStatus('Scheduled');
    setFieldErrors({});
  };

  const handleStartEdit = (delivery: DeliveryItem) => {
    setEditingId(delivery._id);
    setCustomerName(delivery.customerName);
    setCustomerEmail(delivery.customerEmail);
    setCustomerPhone(delivery.customerPhone);
    setAddress(delivery.address);
    setGoogleMapLink(delivery.googleMapLink || '');
    setProductName(delivery.productName);
    setDeliveryAgentName(delivery.deliveryAgentName);
    setDeliveryAgentPhone(delivery.deliveryAgentPhone);
    setDeliveryAgentEmail(delivery.deliveryAgentEmail);
    setDeliveryDate(delivery.deliveryDate);
    setEstimateTime(delivery.estimateTime);
    setStatus(delivery.status);
    setFieldErrors({});
    setIsFormOpen(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleCancelEdit = () => {
    resetForm();
    toast('Edit cancelled', { icon: '↩️' });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

    // Section 1: Customer Details
    if (!customerName.trim()) {
      errors.customerName = 'Customer name is required (min 2 characters)';
    } else if (customerName.trim().length < 2) {
      errors.customerName = 'Customer name must be at least 2 characters';
    }

    if (!customerEmail.trim()) {
      errors.customerEmail = 'Customer email is required';
    } else if (!emailRegex.test(customerEmail.trim())) {
      errors.customerEmail = 'Invalid email address format (e.g. user@example.com)';
    }

    const isValidMobile = (phone: string): boolean => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return true;
      if (digits.length === 11 && digits.startsWith('0')) return true;
      if (digits.length === 12 && digits.startsWith('91')) return true;
      return false;
    };

    if (!customerPhone.trim()) {
      errors.customerPhone = 'Customer phone number is required';
    } else if (!isValidMobile(customerPhone.trim())) {
      errors.customerPhone = 'Enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210)';
    }

    // Section 2: Address & Google Map
    if (!address.trim()) {
      errors.address = 'Full delivery address is required (min 5 characters)';
    } else if (address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }

    if (googleMapLink.trim()) {
      try {
        new URL(googleMapLink.trim());
      } catch {
        errors.googleMapLink = 'Google Map link must be a valid URL (starting with http:// or https://)';
      }
    }

    // Section 3: Product Details
    if (!productName.trim()) {
      errors.productName = 'Product name is required (min 2 characters)';
    } else if (productName.trim().length < 2) {
      errors.productName = 'Product name must be at least 2 characters';
    }

    // Section 4: Delivery Agent & Schedule
    if (!deliveryAgentName.trim()) {
      errors.deliveryAgentName = 'Delivery agent name is required';
    } else if (deliveryAgentName.trim().length < 2) {
      errors.deliveryAgentName = 'Agent name must be at least 2 characters';
    }

    if (!deliveryAgentPhone.trim()) {
      errors.deliveryAgentPhone = 'Delivery agent phone number is required';
    } else if (!isValidMobile(deliveryAgentPhone.trim())) {
      errors.deliveryAgentPhone = 'Enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210)';
    }

    if (!deliveryAgentEmail.trim()) {
      errors.deliveryAgentEmail = 'Delivery agent email is required';
    } else if (!emailRegex.test(deliveryAgentEmail.trim())) {
      errors.deliveryAgentEmail = 'Invalid agent email format (e.g. agent@nexcore.com)';
    }

    if (!deliveryDate.trim()) {
      errors.deliveryDate = 'Delivery date is required';
    }

    if (!estimateTime.trim()) {
      errors.estimateTime = 'Estimated delivery time (ETA) is required';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      googleMapLink: googleMapLink.trim() || undefined,
      productName: productName.trim(),
      deliveryAgentName: deliveryAgentName.trim(),
      deliveryAgentPhone: deliveryAgentPhone.trim(),
      deliveryAgentEmail: deliveryAgentEmail.trim(),
      deliveryDate: deliveryDate.trim(),
      estimateTime: estimateTime.trim(),
      status,
    };

    try {
      if (editingId) {
        await updateDelivery({ id: editingId, ...payload }).unwrap();
        toast.success('Delivery updated! Revised WhatsApp messages dispatched to Customer & Agent.');
      } else {
        await createDelivery(payload).unwrap();
        toast.success('Delivery created! WhatsApp messages sent to Customer & Agent.');
      }

      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || (editingId ? 'Failed to update delivery' : 'Failed to create delivery'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: DeliveryStatus) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      toast.success(`Status updated to ${newStatus} & WhatsApp message sent`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleResendWhatsApp = async (id: string) => {
    try {
      await resendWhatsApp(id).unwrap();
      toast.success('WhatsApp notifications resent to customer and agent!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to resend WhatsApp message');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery record?')) return;
    try {
      await deleteDelivery(id).unwrap();
      toast.success('Delivery record deleted');
      if (selectedDelivery?._id === id) {
        setSelectedDelivery(null);
      }
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Admin Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-mono flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" /> Delivery Form & WhatsApp Dispatch
          </h1>
          <p className="text-sm text-slate-500">
            Create and edit delivery orders, assign agents, and automatically dispatch real-time WhatsApp updates via <span className="font-mono font-semibold text-emerald-600">whatsapp-web.js</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (editingId) resetForm();
              setIsFormOpen(!isFormOpen);
            }}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="w-4 h-4" /> {isFormOpen && !editingId ? 'Collapse Form' : 'New Delivery Form'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Deliveries</p>
            <p className="text-xl font-bold text-slate-900">{totalCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Scheduled</p>
            <p className="text-xl font-bold text-slate-900">{scheduledCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Transit / Dispatched</p>
            <p className="text-xl font-bold text-slate-900">{outForDeliveryCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4 border-slate-100 bg-white">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Delivered</p>
            <p className="text-xl font-bold text-slate-900">{deliveredCount}</p>
          </div>
        </Card>
      </div>

      {/* SECTION: Delivery Creation & Edit Form */}
      {isFormOpen && (
        <div ref={formRef}>
          <Card className={`border shadow-md bg-white overflow-hidden transition-all duration-200 ${editingId ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200/80'}`}>
            <div className={`px-6 py-4 flex items-center justify-between text-white ${editingId ? 'bg-amber-900' : 'bg-slate-900'}`}>
              <div className="flex items-center gap-2.5">
                {editingId ? (
                  <Pencil className="w-5 h-5 text-amber-300" />
                ) : (
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {editingId ? `Edit Delivery Record` : 'Create New Delivery Order'}
                  </h2>
                  {editingId && (
                    <p className="text-xs text-amber-200">
                      Modifying delivery for: <span className="font-bold underline">{customerName || 'Customer'}</span> ({productName || 'Product'})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editingId ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs bg-amber-800 hover:bg-amber-700 text-amber-100 px-2.5 py-1 rounded border border-amber-600 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel Edit
                  </button>
                ) : (
                  <span className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-800 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    WhatsApp Web Dispatch Active
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
              {/* Section 1: Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Section 1: Customer Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe / City Hospital"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.customerName
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (fieldErrors.customerName) setFieldErrors({ ...fieldErrors, customerName: '' });
                      }}
                    />
                    {fieldErrors.customerName && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.customerEmail
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (fieldErrors.customerEmail) setFieldErrors({ ...fieldErrors, customerEmail: '' });
                      }}
                    />
                    {fieldErrors.customerEmail && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.customerEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Phone No (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9876543210"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.customerPhone
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (fieldErrors.customerPhone) setFieldErrors({ ...fieldErrors, customerPhone: '' });
                      }}
                    />
                    {fieldErrors.customerPhone && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Google Map */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Section 2: Delivery Address</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Delivery Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Door/Building No, Street Name, Area, City, State, Pincode"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.address
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                      }}
                    />
                    {fieldErrors.address && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.address}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Google Map Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.googleMapLink
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={googleMapLink}
                      onChange={(e) => {
                        setGoogleMapLink(e.target.value);
                        if (fieldErrors.googleMapLink) setFieldErrors({ ...fieldErrors, googleMapLink: '' });
                      }}
                    />
                    {fieldErrors.googleMapLink ? (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.googleMapLink}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Included in WhatsApp messages as a 1-click navigation pin for agent and customer.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Product Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Section 3: Product Details</h3>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NexCore Interactive Flat Panel 75-inch / Analyzer Kit"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                      fieldErrors.productName
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-emerald-500'
                    }`}
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      if (fieldErrors.productName) setFieldErrors({ ...fieldErrors, productName: '' });
                    }}
                  />
                  {fieldErrors.productName && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.productName}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Delivery Agent & Schedule */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Section 4: Delivery Agent & Schedule</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agent Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.deliveryAgentName
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={deliveryAgentName}
                      onChange={(e) => {
                        setDeliveryAgentName(e.target.value);
                        if (fieldErrors.deliveryAgentName) setFieldErrors({ ...fieldErrors, deliveryAgentName: '' });
                      }}
                    />
                    {fieldErrors.deliveryAgentName && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.deliveryAgentName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agent Phone (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9123456780"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.deliveryAgentPhone
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={deliveryAgentPhone}
                      onChange={(e) => {
                        setDeliveryAgentPhone(e.target.value);
                        if (fieldErrors.deliveryAgentPhone) setFieldErrors({ ...fieldErrors, deliveryAgentPhone: '' });
                      }}
                    />
                    {fieldErrors.deliveryAgentPhone && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.deliveryAgentPhone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agent Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="agent@nexcore.com"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.deliveryAgentEmail
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={deliveryAgentEmail}
                      onChange={(e) => {
                        setDeliveryAgentEmail(e.target.value);
                        if (fieldErrors.deliveryAgentEmail) setFieldErrors({ ...fieldErrors, deliveryAgentEmail: '' });
                      }}
                    />
                    {fieldErrors.deliveryAgentEmail && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.deliveryAgentEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.deliveryDate
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (fieldErrors.deliveryDate) setFieldErrors({ ...fieldErrors, deliveryDate: '' });
                      }}
                    />
                    {fieldErrors.deliveryDate && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.deliveryDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimate Time (ETA) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 02:30 PM / 10 AM - 1 PM"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:outline-none ${
                        fieldErrors.estimateTime
                          ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-emerald-500'
                      }`}
                      value={estimateTime}
                      onChange={(e) => {
                        setEstimateTime(e.target.value);
                        if (fieldErrors.estimateTime) setFieldErrors({ ...fieldErrors, estimateTime: '' });
                      }}
                    />
                    {fieldErrors.estimateTime && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {fieldErrors.estimateTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Status & Submit */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    {editingId ? 'Section 5: Update Status' : 'Section 5: Initial Status'}
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="w-full sm:w-64">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Status
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0">
                    {editingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className={`w-full sm:w-auto px-8 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-sm ${
                        editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isCreating || isUpdating ? (
                        <>
                          <Spinner className="w-4 h-4 text-white" /> {editingId ? 'Updating & Sending WhatsApp...' : 'Creating & Sending WhatsApp...'}
                        </>
                      ) : (
                        <>
                          {editingId ? <Pencil className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                          {editingId ? 'Update Delivery & Send Updated WhatsApp' : 'Save & Send WhatsApp to Customer + Agent'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Main Records Master Table */}
      <Card className="border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <CardTitle className="text-base font-bold text-slate-900">
            Delivery Records ({deliveries.length})
          </CardTitle>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <select
              className="w-full sm:w-44 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                placeholder="Search customer, product, agent..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Truck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No delivery records found matching search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Delivery Agent</th>
                  <th className="py-3 px-3">Date & ETA</th>
                  <th className="py-3 px-3">Address & Map</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((item) => {
                  const style = STATUS_COLORS[item.status] || STATUS_COLORS.Scheduled;
                  const isCurrentEditing = editingId === item._id;
                  return (
                    <tr
                      key={item._id}
                      className={`transition-colors ${
                        isCurrentEditing ? 'bg-amber-50/60 ring-1 ring-amber-300' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Customer Info */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{item.customerName}</p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-emerald-600" /> {item.customerPhone}
                        </p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {item.customerEmail}
                        </p>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                          {item.productName}
                        </span>
                      </td>

                      {/* Delivery Agent */}
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">{item.deliveryAgentName}</p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-emerald-600" /> {item.deliveryAgentPhone}
                        </p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {item.deliveryAgentEmail}
                        </p>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {item.deliveryDate}
                        </p>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" /> {item.estimateTime}
                        </p>
                      </td>

                      {/* Address & Map */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-700 truncate" title={item.address}>
                          {item.address}
                        </p>
                        {item.googleMapLink && (
                          <a
                            href={item.googleMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-800 font-medium mt-1"
                          >
                            <MapPin className="w-3 h-3" /> View Map <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <select
                          className={`text-xs font-semibold px-2 py-1 rounded-md border ${style.bg} ${style.text} ${style.border} focus:outline-none`}
                          value={item.status}
                          disabled={isUpdatingStatus}
                          onChange={(e) => handleStatusChange(item._id, e.target.value as DeliveryStatus)}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            title="Edit Delivery & Reschedule"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedDelivery(item)}
                            title="View Full Details"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResendWhatsApp(item._id)}
                            disabled={isResending}
                            title="Resend WhatsApp Messages to Customer & Agent"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <SendHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={isDeleting}
                            title="Delete Record"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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

      {/* Modal: View Full Details */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Delivery Order Details</h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Current Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[selectedDelivery.status]?.bg} ${STATUS_COLORS[selectedDelivery.status]?.text}`}>
                  {selectedDelivery.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Product Information</p>
                <p className="font-bold text-slate-900 text-base">{selectedDelivery.productName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Customer Details</p>
                  <p className="font-medium text-slate-900">{selectedDelivery.customerName}</p>
                  <p className="text-xs text-emerald-600 font-medium">{selectedDelivery.customerPhone}</p>
                  <p className="text-xs text-slate-500">{selectedDelivery.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Delivery Agent</p>
                  <p className="font-medium text-slate-900">{selectedDelivery.deliveryAgentName}</p>
                  <p className="text-xs text-emerald-600 font-medium">{selectedDelivery.deliveryAgentPhone}</p>
                  <p className="text-xs text-slate-500">{selectedDelivery.deliveryAgentEmail}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Schedule</p>
                <p className="text-sm font-medium text-slate-800">
                  Date: {selectedDelivery.deliveryDate} | ETA: {selectedDelivery.estimateTime}
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Delivery Address</p>
                <p className="text-sm text-slate-800 mt-0.5">{selectedDelivery.address}</p>
                {selectedDelivery.googleMapLink && (
                  <a
                    href={selectedDelivery.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 font-semibold mt-2"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="border-t pt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Created: {formatDate(selectedDelivery.createdAt)}</span>
                <span>By: {selectedDelivery.adminId?.name || 'Admin'}</span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = selectedDelivery;
                    setSelectedDelivery(null);
                    handleStartEdit(d);
                  }}
                  className="text-xs flex items-center gap-1 text-amber-700 hover:bg-amber-50 border-amber-300"
                >
                  <Pencil className="w-3 h-3" /> Edit Delivery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResendWhatsApp(selectedDelivery._id)}
                  className="text-xs flex items-center gap-1 text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                >
                  <SendHorizontal className="w-3 h-3" /> Resend WhatsApp
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedDelivery(null)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white"
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
