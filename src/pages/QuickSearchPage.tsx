import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Tag, Plus, Check, Sparkles, Filter, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ProductItem } from '../utils/shopLogic';

interface QuickSearchPageProps {
  onSelectProductForBill?: (product: ProductItem) => void;
}

export const QuickSearchPage: React.FC<QuickSearchPageProps> = ({
  onSelectProductForBill
}) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; nameEn: string; nameBn: string }[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadCategories();
    fetchProducts('', 'all');
  }, []);

  const loadCategories = async () => {
    try {
      const res = await apiRequest<{ categories: any[] }>('/categories');
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query, selectedCategory);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  const fetchProducts = async (q: string, cat: string) => {
    setLoading(true);
    try {
      let endpoint = `/products/quick-search?q=${encodeURIComponent(q)}`;
      if (cat !== 'all') {
        endpoint += `&category=${cat}`;
      }
      const data = await apiRequest<{ results: ProductItem[] }>(endpoint);
      let list = data.results || [];
      if (cat !== 'all') {
        list = list.filter(p => p.categoryId === cat);
      }
      setResults(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (p: ProductItem) => {
    if (onSelectProductForBill) {
      onSelectProductForBill(p);
      setAddedIds(prev => ({ ...prev, [p.id]: true }));
      setTimeout(() => setAddedIds(prev => ({ ...prev, [p.id]: false })), 1500);
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

  return (
    <div className="space-y-6">
      {/* Title & Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Search className="w-6 h-6 text-amber-500" />
            <span>{t('navQuickSearch')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instant price, availability, and shelf location lookup for shop staff and counter service.
          </p>
        </div>
      </div>

      {/* Prominent Search Bar */}
      <div className="p-4 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('quickSearchPlaceholder')}
            className="w-full pl-13 pr-12 py-3.5 text-base md:text-lg bg-slate-50 dark:bg-slate-800 border-2 border-amber-500/40 focus:border-amber-500 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/10 shadow-xs transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs (Interactive filter controls allowed per design constitution) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {language === 'bn' ? cat.nameBn : cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          {loading ? t('loading') : `Showing ${results.length} matching products`}
        </span>
        <span className="hidden sm:inline">
          Live instant search by English name, বাংলা নাম, category or location
        </span>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(prod => (
          <div
            key={prod.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Product Header & Thumbnail */}
              <div className="flex items-start gap-3">
                {prod.imageUrl && (
                  <img
                    src={prod.imageUrl}
                    alt={prod.nameEn}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {language === 'bn' ? prod.nameBn || prod.nameEn : prod.nameEn}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'bn' ? prod.nameEn : prod.nameBn}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{language === 'bn' ? prod.categoryNameBn || prod.categoryNameEn : prod.categoryNameEn}</span>
                  </div>
                </div>
              </div>

              {/* Location & Status Meta (Quiet text without static pills) */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{prod.location || 'Counter'}</span>
                </div>
                <div>{getStatusBadge(prod.stockStatus)}</div>
              </div>
            </div>

            {/* Bottom: Price & Add to Bill */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Current Selling Price</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white leading-tight">
                  ₹{prod.sellingPrice}{' '}
                  <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-normal">
                    / {prod.unit}
                  </span>
                </div>
              </div>

              {onSelectProductForBill && (
                <button
                  onClick={() => handleAdd(prod)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
                    addedIds[prod.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {addedIds[prod.id] ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bill</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
          <p className="text-sm font-semibold">{t('noProductsFound')}</p>
          <p className="text-xs text-slate-500 mt-1">
            Try a different keyword or select "All Categories".
          </p>
        </div>
      )}
    </div>
  );
};
