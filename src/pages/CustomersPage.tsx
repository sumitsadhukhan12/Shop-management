import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, Receipt, BadgeAlert, History, Eye, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface CustomerItem {
  id: string;
  name: string;
  mobile: string;
  notes?: string;
  totalDue: number;
  totalPaid: number;
  billsCount: number;
  createdAt: string;
}

export const CustomersPage: React.FC = () => {
  const { t } = useLanguage();
  const { error } = useToast();

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Details Modal
  const [activeCustomer, setActiveCustomer] = useState<CustomerItem | null>(null);
  const [customerBills, setCustomerBills] = useState<any[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ customers: CustomerItem[] }>(
        `/customers?search=${encodeURIComponent(search)}`
      );
      setCustomers(res.customers || []);
    } catch (err: any) {
      error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const openCustomerDetails = async (c: CustomerItem) => {
    setActiveCustomer(c);
    setLoadingDetails(true);
    try {
      const res = await apiRequest<{ bills: any[]; payments: any[] }>(`/customers/${c.id}`);
      setCustomerBills(res.bills || []);
      setCustomerPayments(res.payments || []);
    } catch (err: any) {
      error('Failed to load customer details');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>{t('navCustomers')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customer directory for due tracking and billing histories.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer name or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Mobile</th>
                <th className="py-3 px-3 font-semibold">Notes</th>
                <th className="py-3 px-3 font-semibold text-right">Bills Count</th>
                <th className="py-3 px-3 font-semibold text-right">Outstanding Due</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {c.mobile}
                  </td>
                  <td className="py-3 px-3 text-slate-500 truncate max-w-[200px]">
                    {c.notes || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                    {c.billsCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {c.totalDue > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">₹{c.totalDue.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-600">Clear (₹0)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openCustomerDetails(c)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">No customer records found.</p>
          </div>
        )}
      </div>

      {/* Customer History Modal */}
      {activeCustomer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="customer-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <span>Customer Ledger · {activeCustomer.name}</span>
              </h2>
              <button
                onClick={() => setActiveCustomer(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{activeCustomer.name}</div>
                <div className="text-slate-500 font-mono">Ph: {activeCustomer.mobile}</div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Total Outstanding:</span>
                <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                  ₹{activeCustomer.totalDue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  Past Bills ({customerBills.length})
                </h4>
                <div className="space-y-1.5">
                  {customerBills.map(b => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-600">{b.billNumber}</span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(b.billDate).toLocaleDateString()} · {b.items.length} items
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold">₹{b.total}</div>
                        <div className="text-[11px] text-slate-400">
                          Paid: ₹{b.paidAmount} | Due: ₹{b.dueAmount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  Payments Recorded ({customerPayments.length})
                </h4>
                <div className="space-y-1.5">
                  {customerPayments.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-emerald-600">₹{p.amount}</span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString()} · via {p.paymentMethod.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        By: {p.createdByName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
