'use client';
import { useState } from 'react';
import { useGetKPIsQuery, useGetTechnicianPerformanceQuery } from '@/store/api/reportsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Download, BarChart3, TrendingUp, Star, Users } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SuperAdminReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: kpiData } = useGetKPIsQuery();
  const { data: techData, isLoading } = useGetTechnicianPerformanceQuery();

  const kpis = kpiData?.data;
  const techs = (techData?.data || []) as Array<{
    name: string; email: string; totalAssigned: number; resolved: number;
    avgRating?: number; resolutionRate?: number;
  }>;

  const downloadExcel = () => {
    const params = new URLSearchParams({ format: 'xlsx', ...(from && { from }), ...(to && { to }) });
    window.open(`${BASE_URL}/api/reports/tickets?${params}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900">Reports & Analytics</h1>
        </div>
        <Button variant="gold" onClick={downloadExcel}>
          <Download className="w-4 h-4" /> Export Excel
        </Button>
      </div>

      {/* Date Filters */}
      <div className="flex gap-4 flex-wrap items-end">
        <Input label="From Date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" />
        <Input label="To Date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" />
        <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }}>Clear</Button>
      </div>

      {/* KPI Summary */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tickets',  value: kpis.total,              color: 'border-blue-200 bg-blue-50',   text: 'text-blue-800' },
            { label: 'Open',           value: kpis.open,               color: 'border-yellow-200 bg-yellow-50', text: 'text-yellow-800' },
            { label: 'Resolved',       value: kpis.resolved,           color: 'border-green-200 bg-green-50', text: 'text-green-800' },
            { label: 'Closed',         value: kpis.closed,             color: 'border-slate-200 bg-slate-50', text: 'text-slate-700' },
            { label: 'Overdue',        value: kpis.overdue,            color: 'border-red-200 bg-red-50',     text: 'text-red-700' },
            { label: 'SLA Compliance', value: `${kpis.slaCompliant}%`, color: 'border-teal-200 bg-teal-50',   text: 'text-teal-800' },
            { label: 'In Progress',    value: kpis.inProgress,         color: 'border-orange-200 bg-orange-50', text: 'text-orange-800' },
            { label: 'Avg CSAT',       value: kpis.avgRating,          color: 'border-gold-200 bg-gold-50',   text: 'text-gold-800' },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
              <p className={`text-3xl font-extrabold ${k.text}`}>{k.value}</p>
              <p className="text-xs text-slate-600 mt-1 font-medium">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Technician Performance Table */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary-700" />
          <CardTitle>Technician Performance Report</CardTitle>
        </div>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left border-b border-slate-100">
                <tr>
                  {['#','Technician','Email','Assigned','Resolved','Resolution %','Avg CSAT'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {techs.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">No technician data available</td></tr>
                ) : techs.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-gold-500 text-white' :
                        i === 1 ? 'bg-slate-300 text-slate-700' :
                        i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary-900">{t.name}</td>
                    <td className="px-4 py-3 text-slate-500">{t.email}</td>
                    <td className="px-4 py-3 text-center font-medium">{t.totalAssigned}</td>
                    <td className="px-4 py-3 text-center font-semibold text-green-700">{t.resolved}</td>
                    <td className="px-4 py-3 text-center">
                      {t.resolutionRate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                            <div className="bg-primary-700 h-2 rounded-full" style={{ width: `${Math.min(t.resolutionRate, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-600">{Math.round(t.resolutionRate)}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gold-600">
                        <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                        <span className="text-sm font-medium">{t.avgRating ?? '—'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
