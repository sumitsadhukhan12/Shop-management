import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Receipt,
  BadgeAlert,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NavTab } from '../components/Sidebar';
import { BillReceiptData } from '../components/BillReceiptModal';

interface DashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenQuickSearch: () => void;
  onViewBill: (bill: BillReceiptData) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenQuickSearch,
  onViewBill
}) => {
  const { user, isAdmin } = useAuth();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    limitedStock: 0,
    outOfStock: 0,
    todayBillsCount: 0,
    todayBillsTotal: 0,
    pendingDuesTotal: 0,
    pendingDuesCount: 0
  });

  const [alerts, setAlerts] = useState<{
    outOfStockProducts: any[];
    limitedStockProducts: any[];
    pendingCustomerDues: any[];
  }>({
    outOfStockProducts: [],
    limitedStockProducts: [],
    pendingCustomerDues: []
  });

  const [recentBills, setRecentBills] = useState<BillReceiptData[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [prodsRes, billsRes, duesRes] = await Promise.all([
        apiRequest<{ products: any[] }>('/products'),
        apiRequest<{ bills: BillReceiptData[] }>('/bills'),
        apiRequest<{ dueRecords: any[] }>('/payments/dues')
      ]);

      const products = prodsRes.products || [];
      const bills = billsRes.bills || [];
      const dues = duesRes.dueRecords || [];

      const available = products.filter(p => p.stockStatus === 'available').length;
      const limited = products.filter(p => p.stockStatus === 'limited').length;
      const outOfStock = products.filter(p => p.stockStatus === 'out_of_stock').length;

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayBills = bills.filter(b => b.billDate.startsWith(todayStr) && b.status !== 'cancelled');
      const todayTotal = todayBills.reduce((acc, b) => acc + b.total, 0);

      const activeDues = dues.filter(d => d.remainingDue > 0);
      const totalDueAmount = activeDues.reduce((acc, d) => acc + d.remainingDue, 0);

      setStats({
        totalProducts: products.length,
        availableProducts: available,
        limitedStock: limited,
        outOfStock: outOfStock,
        todayBillsCount: todayBills.length,
        todayBillsTotal: todayTotal,
        pendingDuesTotal: totalDueAmount,
        pendingDuesCount: activeDues.length
      });

      setAlerts({
        outOfStockProducts: products.filter(p => p.stockStatus === 'out_of_stock').slice(0, 5),
        limitedStockProducts: products.filter(p => p.stockStatus === 'limited').slice(0, 5),
        pendingCustomerDues: activeDues.slice(0, 5)
      });

      setRecentBills(bills.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Search Launcher */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <span>Sadhukhan Varities</span>
            <span aria-hidden="true">·</span>
            <span>{isAdmin ? t('roleAdmin') : t('roleStaff')} Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {t('welcomeBack')}, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Instant price lookups, stock availability, and retail billing for Sadhukhan Varities.
          </p>

          {/* Large prominent search button */}
          <div className="mt-5">
            <button
              onClick={onOpenQuickSearch}
              className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl border border-white/20 transition-all shadow-inner group backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 font-medium">
                  {t('quickSearchPlaceholder')}
                </span>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg shadow-xs">
                {t('quickSearch')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashTotalProducts')}</span>
            <Package className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.totalProducts}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Catalogued</div>
        </div>

        {/* Available Products */}
        <div
          onClick={() => onNavigate('products')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashAvailable')}</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.availableProducts}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for sale</div>
        </div>

        {/* Limited Stock */}
        <div
          onClick={() => onNavigate('stock-status')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashLimited')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats.limitedStock}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Low inventory</div>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => onNavigate('stock-status')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-rose-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashOutOfStock')}</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {stats.outOfStock}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Needs restock</div>
        </div>

        {/* Today's Bills */}
        <div
          onClick={() => onNavigate('bills')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashTodayBills')}</span>
            <Receipt className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.todayBillsCount}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">₹{stats.todayBillsTotal.toFixed(0)} billed</div>
        </div>

        {/* Pending Due Records */}
        <div
          onClick={() => onNavigate('due-payments')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">{t('dashPendingDues')}</span>
            <BadgeAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            ₹{stats.pendingDuesTotal.toFixed(0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.pendingDuesCount} customers</div>
        </div>
      </div>

      {/* Operational Grid: Quick Actions + Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Inventory Alerts & Stock Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>{t('dashAlerts')}</span>
              </div>
              <button
                onClick={() => onNavigate('stock-status')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>{t('dashViewAll')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {alerts.outOfStockProducts.length === 0 && alerts.limitedStockProducts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                {t('dashNoAlerts')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Out of Stock alerts */}
                {alerts.outOfStockProducts.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-rose-950 dark:text-rose-200 truncate">
                        {p.nameEn}
                      </div>
                      <div className="text-rose-700/80 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{p.location || 'Counter'}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 font-bold uppercase text-[10px] rounded bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                      Out of stock
                    </span>
                  </div>
                ))}

                {/* Limited Stock alerts */}
                {alerts.limitedStockProducts.map(p => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-amber-950 dark:text-amber-200 truncate">
                        {p.nameEn}
                      </div>
                      <div className="text-amber-700/80 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{p.location || 'Counter'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold">₹{p.sellingPrice} / {p.unit}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 font-bold uppercase text-[10px] rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      Limited Stock
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bills Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>{t('dashRecentBills')}</span>
              </div>
              <button
                onClick={() => onNavigate('bills')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>{t('dashViewAll')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-2 font-semibold">{t('billNumber')}</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Items</th>
                    <th className="pb-2 font-semibold text-right">{t('grandTotal')}</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentBills.map(b => (
                    <tr
                      key={b.id}
                      onClick={() => onViewBill(b)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {b.billNumber}
                      </td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {b.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {b.items.map(it => it.productName).join(', ')}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{b.total}
                      </td>
                      <td className="py-2.5 text-right">
                        {b.status === 'cancelled' ? (
                          <span className="font-bold uppercase text-[10px] text-rose-600">
                            Cancelled
                          </span>
                        ) : b.dueAmount > 0 ? (
                          <span className="text-amber-600 font-semibold text-[11px]">
                            Due: ₹{b.dueAmount}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Launchers & Outstanding Dues Summary */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              {t('dashQuickAction')}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('new-bill')}
                className="w-full p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span>{t('navNewBill')}</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenQuickSearch}
                className="w-full p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-between shadow-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>{t('navQuickSearch')}</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => onNavigate('products')}
                  className="w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>{t('addProduct')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onNavigate('due-payments')}
                className="w-full p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4" />
                  <span>{t('navDuePayments')}</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pending Dues Snapshot */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-amber-500" />
                <span>Pending Customer Dues</span>
              </h3>
              <button
                onClick={() => onNavigate('due-payments')}
                className="text-xs font-semibold text-amber-600 hover:underline"
              >
                Ledger
              </button>
            </div>

            {alerts.pendingCustomerDues.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                No active outstanding customer dues.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.pendingCustomerDues.map(d => (
                  <div
                    key={d.customerMobile}
                    onClick={() => onNavigate('due-payments')}
                    className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {d.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {d.customerMobile}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      ₹{d.remainingDue}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
