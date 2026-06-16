import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TicketStatus, Priority } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS: Record<TicketStatus, string> = {
  'Open':                         'bg-blue-100 text-blue-800',
  'Under Review':                 'bg-yellow-100 text-yellow-800',
  'Assigned':                     'bg-purple-100 text-purple-800',
  'Technician Visit Scheduled':   'bg-indigo-100 text-indigo-800',
  'In Progress':                  'bg-orange-100 text-orange-800',
  'Part Required':                'bg-red-100 text-red-800',
  'On Hold':                      'bg-slate-100 text-slate-700',
  'Resolved':                     'bg-green-100 text-green-800',
  'Customer Confirmation Pending':'bg-teal-100 text-teal-800',
  'Closed':                       'bg-gray-200 text-gray-600',
  'Reopened':                     'bg-pink-100 text-pink-800',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low:      'bg-green-100 text-green-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700 font-semibold',
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatShortDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
