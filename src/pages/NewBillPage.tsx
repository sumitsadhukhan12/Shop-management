import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  QrCode,
  DollarSign,
  User,
  Phone,
  Printer,
  Share2,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { calculateBillTotals, ProductItem } from '../utils/shopLogic';
import { BillReceiptModal, BillReceiptData } from '../components/BillReceiptModal';

interface BillItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface NewBillPageProps {
  initialProductToAdd?: ProductItem | null;
  onClearInitialProduct?: () => void;
}

export const NewBillPage: React.FC<NewBillPageProps> = ({
  initialProductToAdd,
  onClearInitialProduct
}) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { success, error, warning } = useToast();

  const [items, setItems] = useState<BillItemRow[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Billing Form
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [shopSettings, setShopSettings] = useState<any>(null);

  // Generated bill modal
  const [generatedBill, setGeneratedBill] = useState<BillReceiptData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add initial product if navigated from Quick Search
  useEffect(() => {
    if (initialProductToAdd) {
      addProductToBill(initialProductToAdd);
      if (onClearInitialProduct) onClearInitialProduct();
    }
  }, [initialProductToAdd]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiRequest<{ settings: any }>('/settings');
      setShopSettings(res.settings);
    } catch (err) {
      console.error(err);
    }
  };

  // Live search for product picker
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest<{ results: ProductItem[] }>(
          `/products/quick-search?q=${encodeURIComponent(productSearch)}`
        );
        setSearchResults(res.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [productSearch]);

  const addProductToBill = (prod: ProductItem) => {
    const existingIndex = items.findIndex(it => it.productId === prod.id);
    const displayName = language === 'bn' ? prod.nameBn || prod.nameEn : prod.nameEn;

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].amount = Number((updated[existingIndex].quantity * updated[existingIndex].unitPrice).toFixed(2));
      setItems(updated);
    } else {
      setItems(prev => [
        ...prev,
        {
          productId: prod.id,
          productName: displayName,
          quantity: 1,
          unit: prod.unit,
          unitPrice: prod.sellingPrice,
          amount: prod.sellingPrice
        }
      ]);
    }
    setProductSearch('');
    setShowDropdown(false);
  };

  const handleQtyChange = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].amount = Number((newQty * updated[index].unitPrice).toFixed(2));
    setItems(updated);
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    if (newPrice < 0) return;
    const updated = [...items];
    updated[index].unitPrice = newPrice;
    updated[index].amount = Number((updated[index].quantity * newPrice).toFixed(2));
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const totalAmount = Number(items.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2));
  const paidAmount = paidAmountInput !== '' ? Number(paidAmountInput) : totalAmount;
  const dueAmount = Number(Math.max(0, totalAmount - paidAmount).toFixed(2));

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      error('Please add at least one product to create a bill.');
      return;
    }

    if (dueAmount > 0) {
      if (!customerName.trim() || !customerMobile.trim()) {
        error(t('dueWarning'));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; bill: BillReceiptData }>('/bills', {
        method: 'POST',
        body: JSON.stringify({
          items,
          paymentMethod,
          paidAmount,
          customerName: customerName ? customerName.trim() : undefined,
          customerMobile: customerMobile ? customerMobile.trim() : undefined
        })
      });

      success(t('billGeneratedSuccess'));
      setGeneratedBill(res.bill);
      // Reset form
      setItems([]);
      setPaidAmountInput('');
      setCustomerName('');
      setCustomerMobile('');
    } catch (err: any) {
      error(err.message || 'Failed to generate bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-500" />
            <span>{t('navNewBill')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Point-of-sale terminal for rapid checkout, item pricing, and customer billing.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              setItems([]);
              setPaidAmountInput('');
            }}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            {t('clearBill')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Search (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fast Product Search / Auto-suggest */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder="Type to search and add product (e.g. 'eng', 'oil', 'ইঞ্জিন')..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => addProductToBill(prod)}
                    className="w-full p-2.5 text-left hover:bg-amber-50/50 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {language === 'bn' ? prod.nameBn || prod.nameEn : prod.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {prod.location} · {prod.unit}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      ₹{prod.sellingPrice}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Line items table */}
          <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Bill Line Items ({items.length})
            </h2>

            {items.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-sm font-semibold">Your bill is empty.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Search above or use Quick Search to add products to the bill.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 pb-2">
                      <th className="pb-2 font-semibold">Product</th>
                      <th className="pb-2 font-semibold text-center w-24">Qty</th>
                      <th className="pb-2 font-semibold text-right w-24">Unit Price</th>
                      <th className="pb-2 font-semibold text-right w-24">Item Total</th>
                      <th className="pb-2 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 pr-2">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Unit: {item.unit}
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity - 1)}
                              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                              className="w-12 text-center text-xs font-mono font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, item.quantity + 1)}
                              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                          ₹{item.unitPrice}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{item.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                            aria-label={`Remove ${item.productName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Checkout & Due Management */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Payment & Checkout
            </h2>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-sans">Grand Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{t('cash')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('upi')}</span>
                </button>
              </div>

              {paymentMethod === 'upi' && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-center">
                  {shopSettings?.upiQrUrl ? (
                    <div>
                      <img
                        src={shopSettings.upiQrUrl}
                        alt="Shop UPI QR"
                        className="w-28 h-28 mx-auto object-contain border p-1 rounded-lg bg-white"
                      />
                      <p className="text-[11px] text-amber-900 dark:text-amber-200 mt-1 font-medium">
                        {t('scanToPay')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-900 dark:text-amber-200">
                      UPI ID: <span className="font-mono font-bold">{shopSettings?.upiId || '9830012345@upi'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Paid Amount & Due Calculation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <label className="text-slate-700 dark:text-slate-300">
                  {t('paidAmount')} (₹)
                </label>
                <button
                  type="button"
                  onClick={() => setPaidAmountInput(String(totalAmount))}
                  className="text-[11px] text-amber-600 hover:underline"
                >
                  Pay in Full
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                value={paidAmountInput}
                onChange={e => setPaidAmountInput(e.target.value)}
                placeholder={`₹${totalAmount}`}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />

              {dueAmount > 0 && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between font-mono">
                  <span className="text-amber-800 dark:text-amber-300 font-bold">
                    Remaining Due:
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-extrabold text-sm">
                    ₹{dueAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Customer Details for Due Records */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('customerInfo')} {dueAmount > 0 && <span className="text-rose-500 font-bold">*</span>}
                </span>
                {dueAmount > 0 && (
                  <span className="text-[10px] text-rose-500 font-semibold uppercase">
                    Required for due
                  </span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value)}
                  placeholder="Mobile (10 digits)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Generate Bill Button */}
            <button
              type="button"
              onClick={handleGenerateBill}
              disabled={isSubmitting || items.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? 'Generating...' : t('generateBill')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {generatedBill && (
        <BillReceiptModal
          bill={generatedBill}
          isOpen={Boolean(generatedBill)}
          onClose={() => setGeneratedBill(null)}
        />
      )}
    </div>
  );
};
