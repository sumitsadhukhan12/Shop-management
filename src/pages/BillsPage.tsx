import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  XCircle,
  Eye,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { BillReceiptModal, BillReceiptData } from '../components/BillReceiptModal';

export const BillsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { success, error } = useToast();

  const [bills, setBills] = useState<BillReceiptData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // View modal
  const [activeBill, setActiveBill] = useState<BillReceiptData | null>(null);

  // Cancel modal
  const [cancellingBill, setCancellingBill] = useState<BillReceiptData | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadBills();
  }, [search, dateFilter, statusFilter]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ bills: BillReceiptData[] }>(
        `/bills?search=${encodeURIComponent(search)}&date=${dateFilter}&status=${statusFilter}`
      );
      setBills(res.bills || []);
    } catch (err: any) {
      error('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBill || !cancelReason.trim()) {
      error('Please enter a cancellation reason.');
      return;
    }

    setIsCancelling(true);
    try {
      await apiRequest(`/bills/${cancellingBill.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason.trim() })
      });
      success(`Bill ${cancellingBill.billNumber} cancelled.`);
      setCancellingBill(null);
      setCancelReason('');
      loadBills();
    } catch (err: any) {
      error(err.message || 'Failed to cancel bill.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>{t('navBills')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete billing records, invoices, print receipts and audit cancellations.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bill number, customer or mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Active Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {(search || dateFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setDateFilter('');
                  setStatusFilter('all');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">{t('billNumber')}</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Items</th>
                <th className="py-3 px-3 font-semibold text-right">Grand Total</th>
                <th className="py-3 px-3 font-semibold text-right">Paid</th>
                <th className="py-3 px-3 font-semibold text-right">Due</th>
                <th className="py-3 px-3 font-semibold text-center">Payment</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                    {b.billNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">
                    {new Date(b.billDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                    <div>{b.customerName || 'Walk-in'}</div>
                    {b.customerMobile && (
                      <div className="text-[10px] text-slate-400 font-mono">{b.customerMobile}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 truncate max-w-[150px]">
                    {b.items.map(it => `${it.productName} (${it.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{b.total}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                    ₹{b.paidAmount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {b.dueAmount > 0 ? (
                      <span className="text-amber-600 font-bold">₹{b.dueAmount}</span>
                    ) : (
                      <span className="text-slate-400">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center uppercase font-mono font-bold text-[10px] text-slate-600 dark:text-slate-300">
                    {b.paymentMethod}
                  </td>
                  <td className="py-3 px-3">
                    {b.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveBill(b)}
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="View & Print Bill"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && b.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setCancellingBill(b);
                            setCancelReason('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Cancel Bill"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bills.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No bills found.</p>
          </div>
        )}
      </div>

      {/* Bill Receipt Modal */}
      {activeBill && (
        <BillReceiptModal
          bill={activeBill}
          isOpen={Boolean(activeBill)}
          onClose={() => setActiveBill(null)}
        />
      )}

      {/* Cancel Bill Confirmation Modal */}
      {cancellingBill && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="cancel-modal-title" className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancel Bill {cancellingBill.billNumber}
              </h2>
              <button
                onClick={() => setCancellingBill(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 my-3">
              This action will mark the bill as cancelled in the ledger while preserving the complete audit trail.
            </p>

            <form onSubmit={handleCancelBill} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer returned items / wrong entry"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingBill(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
