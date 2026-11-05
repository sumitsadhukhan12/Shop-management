import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Clock, UserCheck } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AuditLogItem {
  id: string;
  action: string;
  category: string;
  details: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export const AuditPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    loadLogs();
  }, [isAdmin]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ logs: AuditLogItem[] }>('/audit');
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        Access restricted. Only Administrators can view audit logs.
      </div>
    );
  }

  const filtered = logs.filter(
    l =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.performedByName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span>{t('navAudit')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit trail of important shop operations, price updates, user events, and bill cancellations.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit actions..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Event Details</th>
                <th className="py-3 px-3 font-semibold">Performed By</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 font-mono uppercase text-[10px] text-slate-500">
                    {log.category}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>{log.performedByName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No audit logs found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
