'use client';
import { useGetKPIsQuery, useGetTechnicianPerformanceQuery } from '@/store/api/reportsApi';
import { useGetTicketsQuery } from '@/store/api/ticketsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  Ticket, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Star, Shield, Users, BarChart3, Activity,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { data: kpiData, isLoading: kpiLoading } = useGetKPIsQuery();
  const { data: ticketsData } = useGetTicketsQuery({ limit: 10 });
  const { data: techData } = useGetTechnicianPerformanceQuery();

  const kpis = kpiData?.data;
  const tickets = ticketsData?.tickets || [];
  const techs = (techData?.data || []) as Array<{
    name: string; totalAssigned: number; resolved: number; avgRating?: number; resolutionRate?: number;
  }>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Super Admin Overview</h1>
          <p className="text-sm text-slate-500">Platform-wide analytics and controls</p>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiLoading ? (
        <Spinner className="py-8" />
      ) : kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets',  value: kpis.total,          icon: Ticket,        color: 'bg-blue-50 text-blue-700',   border: 'border-blue-100' },
            { label: 'Open',           value: kpis.open,           icon: Activity,      color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-100' },
            { label: 'In Progress',    value: kpis.inProgress,     icon: Clock,         color: 'bg-orange-50 text-orange-700', border: 'border-orange-100' },
            { label: 'Resolved',       value: kpis.resolved,       icon: CheckCircle,   color: 'bg-green-50 text-green-700',  border: 'border-green-100' },
            { label: 'Closed',         value: kpis.closed,         icon: CheckCircle,   color: 'bg-slate-50 text-slate-700',  border: 'border-slate-100' },
            { label: 'Overdue ⚠',     value: kpis.overdue,        icon: AlertTriangle, color: 'bg-red-50 text-red-700',      border: 'border-red-100' },
            { label: 'SLA Compliance', value: `${kpis.slaCompliant}%`, icon: TrendingUp, color: 'bg-teal-50 text-teal-700', border: 'border-teal-100' },
            { label: 'Avg CSAT',       value: kpis.avgRating,      icon: Star,          color: 'bg-gold-50 text-gold-700',    border: 'border-gold-100' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-4 shadow-card flex items-center gap-4`}>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Recent Tickets</CardTitle>
              <Link href="/superadmin/tickets" className="text-sm text-primary-700 hover:underline font-medium">
                View all →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b border-slate-100">
                    {['Ticket','Customer','Category','Status','Created'].map((h) => (
                      <th key={h} className="pb-3 font-medium text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tickets.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">No tickets</td></tr>
                  ) : tickets.map((t) => {
                    const customer = typeof t.customerId === 'object' ? t.customerId : null;
                    return (
                      <tr key={t._id} className="hover:bg-slate-50">
                        <td className="py-3">
                          <Link href={`/superadmin/tickets/${t.ticketId}`} className="font-mono text-xs font-semibold text-primary-700 hover:underline">
                            {t.ticketId}
                          </Link>
                          {t.isOverdue && <Badge className="ml-1 bg-red-100 text-red-600 text-[10px]">OVERDUE</Badge>}
                        </td>
                        <td className="py-3 text-xs text-slate-700">{customer?.name || '—'}</td>
                        <td className="py-3 text-xs text-slate-600">{t.issueCategory}</td>
                        <td className="py-3"><StatusBadge status={t.status} /></td>
                        <td className="py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Technician Leaderboard */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary-700" />
            <CardTitle>Technician Leaderboard</CardTitle>
          </div>
          {techs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
          ) : techs.slice(0, 8).map((tech, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i === 0 ? 'bg-gold-500 text-white' :
                i === 1 ? 'bg-slate-300 text-slate-700' :
                i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">{tech.name}</p>
                <p className="text-xs text-slate-500">{tech.resolved}/{tech.totalAssigned} closed</p>
              </div>
              <div className="flex items-center gap-0.5 text-gold-600 text-xs font-medium flex-shrink-0">
                <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                {tech.avgRating ?? '—'}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
