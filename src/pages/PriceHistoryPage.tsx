import React, { useState, useEffect } from 'react';
import { History, Search, ArrowRight, UserCheck } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface PriceHistoryEntry {
  id: string;
  productId: string;
  productNameEn: string;
  productNameBn: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

export const PriceHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { error } = useToast();

  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    loadHistory();
  }, [isAdmin]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ history: PriceHistoryEntry[] }>('/price-history');
      setHistory(res.history || []);
    } catch (err: any) {
      error(err.message || 'Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200">
        Access restricted. Only Administrators can access price history.
      </div>
    );
  }

  const filtered = history.filter(
    h =>
      h.productNameEn.toLowerCase().includes(search.toLowerCase()) ||
      h.productNameBn.includes(search) ||
      h.changedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-500" />
            <span>{t('navPriceHistory')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit trail of selling price revisions across products. Strictly restricted to Shop Admin.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter product or user..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Price Revision</th>
                <th className="py-3 px-4 font-semibold">Difference</th>
                <th className="py-3 px-4 font-semibold">Authorized By</th>
                <th className="py-3 px-4 font-semibold text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(ph => {
                const diff = ph.newPrice - ph.oldPrice;
                return (
                  <tr key={ph.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {language === 'bn' ? ph.productNameBn || ph.productNameEn : ph.productNameEn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'bn' ? ph.productNameEn : ph.productNameBn}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span className="text-slate-400 line-through mr-1.5">₹{ph.oldPrice}</span>
                      <ArrowRight className="inline w-3 h-3 text-slate-400 mx-1" />
                      <span className="font-bold text-slate-900 dark:text-white">₹{ph.newPrice}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {diff > 0 ? (
                        <span className="text-emerald-600 font-semibold">+₹{diff.toFixed(2)}</span>
                      ) : diff < 0 ? (
                        <span className="text-rose-600 font-semibold">-₹{Math.abs(diff).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">Initial Price</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>{ph.changedBy}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      {new Date(ph.changedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No price history records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
