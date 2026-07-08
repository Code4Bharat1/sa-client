'use client';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Wrench, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function TechnicianDashboard() {
  const { data: allTicketsData, isLoading: allLoading } = useGetTicketsQuery({ limit: 100 });
  const tickets = allTicketsData?.tickets || [];

  const assigned = tickets.filter(t => t.status === 'Assigned');
  const inProgress = tickets.filter(t => t.status === 'In Progress');
  const resolved = tickets.filter(t => t.status === 'Resolved');
  const activeVisits = tickets.filter(t => t.status === 'Technician Visit Scheduled' && t.scheduledVisitDate);

  // Compute deadline metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Date utilities for "This Week" (next 7 days starting from today)
  const sevenDaysLater = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeTickets = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed');

  const overdueTickets = activeTickets.filter(t => {
    if (t.isOverdue) return true;
    if (t.resolutionDeadline && new Date(t.resolutionDeadline).getTime() < Date.now()) return true;
    return false;
  });

  const dueTodayTickets = activeTickets.filter(t => {
    if (!t.resolutionDeadline) return false;
    const dDate = new Date(t.resolutionDeadline);
    return dDate >= todayStart && dDate <= todayEnd;
  });

  const dueThisWeekTickets = activeTickets.filter(t => {
    if (!t.resolutionDeadline) return false;
    const dDate = new Date(t.resolutionDeadline);
    return dDate >= todayStart && dDate <= sevenDaysLater;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
          <p className="text-sm text-gray-500">Manage assignments, track deadlines, and schedule customer visits</p>
        </div>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Assigned Tickets', value: assigned.length, icon: Wrench, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'In Progress', value: inProgress.length, icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Resolved Tickets', value: resolved.length, icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`flex items-center gap-4 border ${s.color} shadow-sm`}>
              <div className="p-3 rounded-xl bg-white"><Icon className="w-6 h-6" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* SLA & Deadline Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-red-100 bg-red-50/50 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 text-red-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{overdueTickets.length}</p>
            <p className="text-xs text-red-600 font-medium">Overdue Tickets</p>
          </div>
        </Card>

        <Card className="border border-amber-100 bg-amber-50/50 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{dueTodayTickets.length}</p>
            <p className="text-xs text-amber-600 font-medium">Due Today</p>
          </div>
        </Card>

        <Card className="border border-yellow-100 bg-yellow-50/50 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-100 text-yellow-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-700">{dueThisWeekTickets.length}</p>
            <p className="text-xs text-yellow-600 font-medium">Due This Week</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Assigned Tickets</h2>
              <Link href="/technician/tickets" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {allLoading ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left border-b border-gray-100">
                    <tr>
                      {['Ticket ID','Category','Priority','Status','Deadline'].map((h) => (
                        <th key={h} className="pb-3 font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tickets.slice(0, 5).map((t) => {
                      const hasDeadline = !!t.resolutionDeadline;
                      const isLate = hasDeadline && new Date(t.resolutionDeadline!).getTime() < Date.now() && t.status !== 'Resolved' && t.status !== 'Closed';
                      
                      return (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <Link href={`/technician/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">{t.ticketId}</Link>
                          </td>
                          <td className="py-3 text-xs text-gray-600">{t.issueCategory}</td>
                          <td className="py-3"><PriorityBadge priority={t.priority} /></td>
                          <td className="py-3"><StatusBadge status={t.status} /></td>
                          <td className={`py-3 text-xs font-semibold ${isLate ? 'text-red-600' : 'text-slate-500'}`}>
                            {t.resolutionDeadline ? formatDate(t.resolutionDeadline) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {tickets.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-gray-400">No tickets found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Upcoming visits */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Scheduled Visits</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left border-b border-gray-100">
                  <tr>
                    {['Ticket ID', 'Customer', 'Scheduled Visit', 'Status'].map(h => (
                      <th key={h} className="pb-2 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeVisits.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-xs">No scheduled visits</td></tr>
                  ) : activeVisits.slice(0, 5).map(t => {
                    const cust = typeof t.customerId === 'object' ? t.customerId : null;
                    return (
                      <tr key={t._id} className="hover:bg-gray-50">
                        <td className="py-3">
                          <Link href={`/technician/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">{t.ticketId}</Link>
                        </td>
                        <td className="py-3 text-xs text-gray-700">{cust?.name || '—'}</td>
                        <td className="py-3 text-xs text-indigo-700 font-semibold">{formatDate(t.scheduledVisitDate)}</td>
                        <td className="py-3"><StatusBadge status={t.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Upcoming Deadlines Widget */}
        <Card className="h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Urgent Deadlines</h2>
          </div>
          <div className="space-y-4">
            {activeTickets.filter(t => t.resolutionDeadline).slice(0, 5).map(t => {
              const diffMs = new Date(t.resolutionDeadline!).getTime() - Date.now();
              const isLate = diffMs < 0;
              const absMs = Math.abs(diffMs);
              const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
              const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const remainingText = isLate ? `${days}d ${hours}h overdue` : `${days}d ${hours}h left`;

              return (
                <div key={t._id} className="flex flex-col p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <Link href={`/technician/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">
                      {t.ticketId}
                    </Link>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{t.issueCategory}</span>
                    <span className={`text-xs font-semibold ${isLate ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingText}
                    </span>
                  </div>
                </div>
              );
            })}
            {activeTickets.filter(t => t.resolutionDeadline).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No active deadlines</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
