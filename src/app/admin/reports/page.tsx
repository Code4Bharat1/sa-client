'use client';
import { useState } from 'react';
import { useGetKPIsQuery, useGetTechnicianPerformanceQuery } from '@/store/api/reportsApi';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Download, Star } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminReportsPage() {
  const { data: kpiData } = useGetKPIsQuery();
  const { data: techData, isLoading } = useGetTechnicianPerformanceQuery();
  const { accessToken } = useAuth();

  const kpis = kpiData?.data;
  const techs = (techData?.data || []) as Array<{
    name: string; email: string; totalAssigned: number; resolved: number; avgRating?: number; resolutionRate?: number;
  }>;

  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams({ format: 'xlsx' });
      const response = await fetch(`${BASE_URL}/api/reports/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download Excel report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button onClick={downloadExcel}><Download className="w-4 h-4" /> Export Excel</Button>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: kpis.total },
            { label: 'Open', value: kpis.open },
            { label: 'Resolved', value: kpis.resolved },
            { label: 'Closed', value: kpis.closed },
            { label: 'Overdue', value: kpis.overdue },
            { label: 'SLA %', value: `${kpis.slaCompliant}%` },
            { label: 'Avg Rating', value: kpis.avgRating },
          ].map((k) => (
            <Card key={k.label} className="text-center py-4">
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle className="mb-4">Technician Performance</CardTitle>
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-gray-100">
                  {['Technician','Email','Assigned','Resolved','Resolution Rate','Avg Rating'].map((h) => (
                    <th key={h} className="pb-3 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {techs.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No data</td></tr>
                ) : techs.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="py-3 text-gray-500">{t.email}</td>
                    <td className="py-3 text-center">{t.totalAssigned}</td>
                    <td className="py-3 text-center text-green-600 font-medium">{t.resolved}</td>
                    <td className="py-3 text-center">{t.resolutionRate !== undefined && t.resolutionRate !== null ? `${Math.round(t.resolutionRate)}%` : '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{t.avgRating || '—'}</span>
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
