import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Tag, Plus, Check, ArrowRight } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ProductItem } from '../utils/shopLogic';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForBill?: (product: ProductItem) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProductForBill
}) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchResults(query);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 150); // fast 150ms debounce
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<{ results: ProductItem[] }>(
        `/products/quick-search?q=${encodeURIComponent(q)}`
      );
      setResults(data.results || []);
    } catch (err) {
      console.error('Quick search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('statusAvailable')}
          </span>
        );
      case 'limited':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('statusLimited')}
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {t('statusOutOfStock')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {t('statusInactive')}
          </span>
        );
    }
  };

  const handleAdd = (p: ProductItem) => {
    if (onSelectProductForBill) {
      onSelectProductForBill(p);
      setAddedIds(prev => ({ ...prev, [p.id]: true }));
      setTimeout(() => {
        setAddedIds(prev => ({ ...prev, [p.id]: false }));
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-search-heading"
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header & Search Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <h2 id="quick-search-heading" className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              {t('quickSearch')} · {t('shopName')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('quickSearchPlaceholder')}
              className="w-full pl-11 pr-10 py-3 text-base bg-white dark:bg-slate-800 border-2 border-amber-500/40 focus:border-amber-500 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 shadow-xs"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {loading ? t('loading') : `${results.length} ${t('navProducts')} found`}
            </span>
            <span className="hidden sm:inline">English · বাংলা · Category · Location</span>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {results.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-sm font-medium">{t('noProductsFound')}</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching "Engine", "Oil", "ইঞ্জিন", "লবণ", "Rack", or "Shelf"
              </p>
            </div>
          )}

          {results.map(prod => (
            <div
              key={prod.id}
              className="group p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 bg-white dark:bg-slate-800/60 hover:bg-amber-50/20 dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Thumbnail if present (no large empty box!) */}
                {prod.imageUrl && (
                  <img
                    src={prod.imageUrl}
                    alt={prod.nameEn}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}

                <div className="min-w-0">
                  {/* Product Names: English + Bengali */}
                  <div className="font-semibold text-sm md:text-base text-slate-900 dark:text-white truncate">
                    {language === 'bn' ? prod.nameBn || prod.nameEn : prod.nameEn}
                  </div>
                  {/* Secondary name */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {language === 'bn' ? prod.nameEn : prod.nameBn}
                  </div>

                  {/* Category & Location metadata without static pills */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>{language === 'bn' ? prod.categoryNameBn || prod.categoryNameEn : prod.categoryNameEn}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{prod.location || 'Counter'}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    {getStatusBadge(prod.stockStatus)}
                  </div>
                </div>
              </div>

              {/* Price & Add to Bill */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white font-mono leading-tight">
                    ₹{prod.sellingPrice}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    / {prod.unit}
                  </div>
                </div>

                {onSelectProductForBill && (
                  <button
                    onClick={() => handleAdd(prod)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
                      addedIds[prod.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                    }`}
                    title="Add to current bill"
                  >
                    {addedIds[prod.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bill</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{t('pressToSearch')}</span>
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
          >
            ESC to close
          </button>
        </div>
      </div>
    </div>
  );
};
