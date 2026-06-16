'use client';
import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/store/api/reportsApi';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { FileText, Shield } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  STATUS_UPDATE:  'bg-blue-100 text-blue-700',
  ASSIGN:         'bg-purple-100 text-purple-700',
  CREATE_USER:    'bg-green-100 text-green-700',
  UPDATE_USER:    'bg-yellow-100 text-yellow-700',
};

const ENTITY_OPTS = [
  { value: '', label: 'All Entities' },
  { value: 'Ticket', label: 'Ticket' },
  { value: 'User', label: 'User' },
];

export default function AuditLogsPage() {
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetAuditLogsQuery({ entity, page });
  const logs = (data?.data || []) as Array<{
    _id: string;
    actorId: { name: string; role: string } | string;
    action: string;
    entity: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ipAddress?: string;
    timestamp: string;
  }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Audit Logs</h1>
          <p className="text-sm text-slate-500">Complete record of all admin and system actions</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select options={ENTITY_OPTS} value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="w-44" />
      </div>

      {isLoading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left border-b border-slate-100">
                  <tr>
                    {['Timestamp','Actor','Action','Entity','Entity ID','Before','After'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">No audit logs found</td></tr>
                  ) : logs.map((log) => {
                    const actor = typeof log.actorId === 'object' ? log.actorId : null;
                    return (
                      <tr key={log._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <p className="font-medium text-primary-900">{actor?.name || '—'}</p>
                            {actor?.role && <p className="text-slate-400 capitalize">{actor.role}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.entity}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.entityId}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">
                          {log.before ? JSON.stringify(log.before) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 max-w-[140px] truncate">
                          {log.after ? JSON.stringify(log.after) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{data?.total || 0} log entries</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
              <span className="text-sm text-slate-600 px-2">Page {page}</span>
              <Button variant="outline" size="sm" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
