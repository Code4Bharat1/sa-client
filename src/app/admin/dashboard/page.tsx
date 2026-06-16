'use client';
import { useGetKPIsQuery, useGetTechnicianPerformanceQuery } from '@/store/api/reportsApi';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  Ticket, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Star,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: kpiData, isLoading: kpiLoading } = useGetKPIsQuery();
  const { data: ticketsData, isLoading: ticketsLoading } = useGetTicketsQuery({ limit: 8 });
  const { data: techData } = useGetTechnicianPerformanceQuery();

  const kpis = kpiData?.data;
  const tickets = ticketsData?.tickets || [];

  const statCards = kpis
    ? [
        { label: 'Total Tickets', value: kpis.total, icon: Ticket, color: 'text-blue-600 bg-blue-50' },
        { label: 'Open', value: kpis.open, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
        { label: 'In Progress', value: kpis.inProgress, icon: Clock, color: 'text-orange-600 bg-orange-50' },
        { label: 'Closed', value: kpis.closed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        { label: 'Overdue', value: kpis.overdue, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        { label: 'SLA Compliant', value: `${kpis.slaCompliant}%`, icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
        { label: 'Avg Rating', value: kpis.avgRating, icon: Star, color: 'text-yellow-600 bg-yellow-50' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {kpiLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="flex flex-col items-center text-center p-4">
                <div className={`p-2 rounded-lg ${stat.color} mb-2`}><Icon className="w-5 h-5" /></div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Recent Tickets</CardTitle>
              <Link href="/admin/tickets" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            {ticketsLoading ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b border-gray-100">
                      {['Ticket', 'Customer', 'Category', 'Status', 'Created'].map((h) => (
                        <th key={h} className="pb-3 font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tickets.map((t) => {
                      const customer = typeof t.customerId === 'object' ? t.customerId : null;
                      return (
                        <tr key={t._id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <Link href={`/admin/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-600 hover:underline">{t.ticketId}</Link>
                          </td>
                          <td className="py-3 text-gray-700 text-xs">{customer?.name || '—'}</td>
                          <td className="py-3 text-gray-600 text-xs">{t.issueCategory}</td>
                          <td className="py-3"><StatusBadge status={t.status} /></td>
                          <td className="py-3 text-gray-500 text-xs">{formatDate(t.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <CardTitle className="mb-4">Technician Performance</CardTitle>
          {techData?.data && (techData.data as Array<{ name: string; resolved: number; totalAssigned: number; avgRating: number }>).slice(0, 5).map((tech, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <div>
                <p className="font-medium text-gray-900">{tech.name}</p>
                <p className="text-xs text-gray-500">{tech.resolved}/{tech.totalAssigned} resolved</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="w-3 h-3 fill-yellow-400" />
                <span className="text-xs font-medium">{tech.avgRating || 'N/A'}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
