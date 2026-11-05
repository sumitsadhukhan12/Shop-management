import React, { useState, useEffect } from 'react';
import { BadgeAlert, Search, MapPin, CheckCircle, AlertTriangle, XCircle, Tag } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { ProductItem } from '../utils/shopLogic';

export const StockStatusPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { success, error } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'all' | 'limited' | 'out_of_stock' | 'available'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ products: ProductItem[] }>('/products');
      setProducts(res.products || []);
    } catch (err: any) {
      error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (product: ProductItem, newStatus: string) => {
    if (!isAdmin) return;
    try {
      await apiRequest(`/products/${product.id}/stock-status`, {
        method: 'PUT',
        body: JSON.stringify({ stockStatus: newStatus })
      });
      success(`Updated ${product.nameEn} to ${newStatus}`);
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, stockStatus: newStatus as any } : p))
      );
    } catch (err: any) {
      error(err.message || 'Failed to update stock status');
    }
  };

  const filtered = products.filter(p => {
    if (statusTab !== 'all' && p.stockStatus !== statusTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.nameEn.toLowerCase().includes(q) ||
        p.nameBn.includes(q) ||
        (p.categoryNameEn && p.categoryNameEn.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const availableCount = products.filter(p => p.stockStatus === 'available').length;
  const limitedCount = products.filter(p => p.stockStatus === 'limited').length;
  const outOfStockCount = products.filter(p => p.stockStatus === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BadgeAlert className="w-6 h-6 text-amber-500" />
            <span>{t('navStockStatus')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor stock levels and change availability statuses. (Manual admin control).
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stock..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Stock Filter Tabs (functional controls) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusTab('all')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
            statusTab === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          All Items ({products.length})
        </button>

        <button
          onClick={() => setStatusTab('limited')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
            statusTab === 'limited'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Limited Stock ({limitedCount})</span>
        </button>

        <button
          onClick={() => setStatusTab('out_of_stock')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
            statusTab === 'out_of_stock'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Out of Stock ({outOfStockCount})</span>
        </button>

        <button
          onClick={() => setStatusTab('available')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
            statusTab === 'available'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Available ({availableCount})</span>
        </button>
      </div>

      {/* Grid of Stock Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {language === 'bn' ? p.nameBn || p.nameEn : p.nameEn}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  {language === 'bn' ? p.nameEn : p.nameBn}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{language === 'bn' ? p.categoryNameBn || p.categoryNameEn : p.categoryNameEn}</span>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-base font-bold text-slate-900 dark:text-white">₹{p.sellingPrice}</div>
                <div className="text-[11px] text-slate-400">/ {p.unit}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{p.location || 'Counter'}</span>
              </div>

              {isAdmin ? (
                <select
                  value={p.stockStatus}
                  onChange={e => handleUpdateStatus(p, e.target.value)}
                  className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="available">🟢 Available</option>
                  <option value="limited">🟠 Limited Stock</option>
                  <option value="out_of_stock">🔴 Out of Stock</option>
                  <option value="inactive">⚫ Inactive</option>
                </select>
              ) : (
                <span className="font-semibold capitalize text-xs">
                  {p.stockStatus === 'available' && '🟢 Available'}
                  {p.stockStatus === 'limited' && '🟠 Limited Stock'}
                  {p.stockStatus === 'out_of_stock' && '🔴 Out of Stock'}
                  {p.stockStatus === 'inactive' && '⚫ Inactive'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="py-12 text-center text-slate-400">
          <BadgeAlert className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
          <p className="text-sm font-semibold">No products found under this stock status.</p>
        </div>
      )}
    </div>
  );
};
