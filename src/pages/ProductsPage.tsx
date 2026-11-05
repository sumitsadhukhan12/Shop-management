import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  MapPin,
  Check,
  Upload,
  ArrowUpDown,
  History
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';
import { ProductItem } from '../utils/shopLogic';

const DEFAULT_UNITS = [
  'Piece',
  'Bottle',
  'Box',
  'Packet',
  'Kg',
  'Gram',
  'Litre',
  'ml',
  'Meter',
  'Set',
  'Dozen',
  'Other'
];

export const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { success, error } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; nameEn: string; nameBn: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Modal: Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [unit, setUnit] = useState('Piece');
  const [stockStatus, setStockStatus] = useState<'available' | 'limited' | 'out_of_stock' | 'inactive'>('available');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        apiRequest<{ products: ProductItem[] }>(
          `/products?search=${encodeURIComponent(search)}&category=${selectedCategory}&status=${selectedStatus}&sortBy=${sortBy}`
        ),
        apiRequest<{ categories: any[] }>('/categories')
      ]);

      setProducts(prodsRes.products || []);
      setCategories(catsRes.categories || []);
      if (catsRes.categories?.length && !categoryId) {
        setCategoryId(catsRes.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNameEn('');
    setNameBn('');
    setCategoryId(categories[0]?.id || '');
    setPurchasePrice('');
    setSellingPrice('');
    setUnit('Piece');
    setStockStatus('available');
    setLocation('Rack 1 / Shelf 1');
    setImageFile(null);
    setImageSizeKb(null);
    setShowModal(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setNameEn(p.nameEn);
    setNameBn(p.nameBn);
    setCategoryId(p.categoryId);
    setPurchasePrice(p.purchasePrice !== undefined ? String(p.purchasePrice) : '');
    setSellingPrice(String(p.sellingPrice));
    setUnit(p.unit);
    setStockStatus(p.stockStatus);
    setLocation(p.location);
    setImageFile(p.imageUrl || null);
    setImageSizeKb(null);
    setShowModal(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, sizeKb } = await compressImage(file, 800, 800, 0.78);
      setImageFile(dataUrl);
      setImageSizeKb(sizeKb);
      success(`Image compressed: ${sizeKb} KB`);
    } catch (err: any) {
      error(err.message || 'Image processing failed');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameBn || !categoryId || !sellingPrice || !unit) {
      error('Please fill in all mandatory fields.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        nameEn,
        nameBn,
        categoryId,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        sellingPrice: Number(sellingPrice),
        unit,
        stockStatus,
        location: location || 'Counter',
        imageFile: imageFile && imageFile.startsWith('data:image/') ? imageFile : undefined
      };

      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        success('Product updated successfully!');
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        success('Product created successfully!');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (p: ProductItem) => {
    try {
      await apiRequest(`/products/${p.id}`, { method: 'DELETE' });
      success(`Product "${p.nameEn}" removed or deactivated.`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete product.');
    }
  };

  const handleQuickStatusChange = async (p: ProductItem, newStatus: string) => {
    if (!isAdmin) return;
    try {
      await apiRequest(`/products/${p.id}/stock-status`, {
        method: 'PUT',
        body: JSON.stringify({ stockStatus: newStatus })
      });
      success(`Stock updated: ${p.nameEn}`);
      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, stockStatus: newStatus as any } : item));
    } catch (err: any) {
      error(err.message || 'Failed to update stock status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>{t('navProducts')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage product prices, units, stock status, and shelf locations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product (EN/BN)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {language === 'bn' ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="available">🟢 {t('statusAvailable')}</option>
            <option value="limited">🟠 {t('statusLimited')}</option>
            <option value="out_of_stock">🔴 {t('statusOutOfStock')}</option>
            <option value="inactive">⚫ {t('statusInactive')}</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="recent">{t('sortRecentlyUpdated')}</option>
            <option value="price_asc">{t('sortPriceLowHigh')}</option>
            <option value="price_desc">{t('sortPriceHighLow')}</option>
            <option value="name">{t('sortName')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-3 font-semibold">{t('category')}</th>
                {isAdmin && <th className="py-3 px-3 font-semibold text-right">Cost (₹)</th>}
                <th className="py-3 px-3 font-semibold text-right">{t('sellingPrice')}</th>
                <th className="py-3 px-3 font-semibold">{t('unit')}</th>
                <th className="py-3 px-3 font-semibold">{t('stockStatus')}</th>
                <th className="py-3 px-3 font-semibold">{t('locationInShop')}</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt={p.nameEn}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {language === 'bn' ? p.nameBn || p.nameEn : p.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'bn' ? p.nameEn : p.nameBn}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {language === 'bn' ? p.categoryNameBn || p.categoryNameEn : p.categoryNameEn}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {p.purchasePrice !== undefined ? `₹${p.purchasePrice}` : '-'}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ₹{p.sellingPrice}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {p.unit}
                  </td>
                  <td className="py-3 px-3">
                    {isAdmin ? (
                      <select
                        value={p.stockStatus}
                        onChange={e => handleQuickStatusChange(p, e.target.value)}
                        className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="available">🟢 Available</option>
                        <option value="limited">🟠 Limited</option>
                        <option value="out_of_stock">🔴 Out of Stock</option>
                        <option value="inactive">⚫ Inactive</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-[11px] capitalize">
                        {p.stockStatus === 'available' && '🟢 Available'}
                        {p.stockStatus === 'limited' && '🟠 Limited Stock'}
                        {p.stockStatus === 'out_of_stock' && '🔴 Out of Stock'}
                        {p.stockStatus === 'inactive' && '⚫ Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{p.location || 'Counter'}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Edit Product"
                          aria-label={`Edit ${p.nameEn}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Delete / Deactivate"
                          aria-label={`Delete ${p.nameEn}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-sm font-semibold">{t('noProductsFound')}</p>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="mt-3 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl"
              >
                + {t('addProduct')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="product-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <span>{editingProduct ? t('editProduct') : t('addProduct')}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4 text-xs">
              {/* Product Names: English & Bengali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('productNameEn')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    placeholder="e.g. Engine Oil 20W40"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('productNameBn')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameBn}
                    onChange={e => setNameBn(e.target.value)}
                    placeholder="e.g. ইঞ্জিন তেল ২০ডব্লিউ৪০"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('category')} *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} ({c.nameBn})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('unit')} *
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DEFAULT_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selling Price & Purchase Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('sellingPrice')} (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value)}
                    placeholder="450"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {editingProduct && Number(sellingPrice) !== editingProduct.sellingPrice && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
                      <History className="w-3 h-3" />
                      Will record price change: ₹{editingProduct.sellingPrice} → ₹{sellingPrice}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('purchasePrice')} (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value)}
                    placeholder="Cost price (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Stock Status & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('stockStatus')}
                  </label>
                  <select
                    value={stockStatus}
                    onChange={e => setStockStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="available">🟢 Available</option>
                    <option value="limited">🟠 Limited Stock</option>
                    <option value="out_of_stock">🔴 Out of Stock</option>
                    <option value="inactive">⚫ Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('locationInShop')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Rack 3 / Shelf 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Product Image Upload with Client Compression */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('productImage')} (JPG, PNG, WebP)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <div className="flex items-center gap-2">
                      <img
                        src={imageFile}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border"
                      />
                      {imageSizeKb && (
                        <span className="text-[11px] text-slate-500">
                          ~{imageSizeKb} KB
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImageSizeKb(null);
                        }}
                        className="text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : t('save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
