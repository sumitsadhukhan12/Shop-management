import React from 'react';
import { Printer, Download, Share2, X, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export interface BillReceiptData {
  id: string;
  billNumber: string;
  billDate: string;
  createdByName: string;
  customerName?: string;
  customerMobile?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: 'cash' | 'upi';
  paidAmount: number;
  dueAmount: number;
  status: 'completed' | 'cancelled';
  cancelledAt?: string;
  cancelledByName?: string;
  cancellationReason?: string;
  shopSnapshot: {
    shopName: string;
    adminName: string;
    address: string;
    mobile: string;
    logoUrl?: string;
    upiQrUrl?: string;
    upiId?: string;
  };
}

interface BillReceiptModalProps {
  bill: BillReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  bill,
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();
  const { success } = useToast();

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const summary = `${bill.shopSnapshot.shopName}\nBill: ${bill.billNumber}\nDate: ${new Date(bill.billDate).toLocaleDateString()}\nTotal: ₹${bill.total} (Paid: ₹${bill.paidAmount}, Due: ₹${bill.dueAmount})\nItems: ${bill.items.length}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber} - ${bill.shopSnapshot.shopName}`,
          text: summary,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(summary);
      success(t('copiedToClipboard'));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Top Action Bar (hidden in print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('printBill')} · <span className="font-mono text-amber-600 dark:text-amber-400">{bill.billNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printBill')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadPdf')}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
              title={t('shareBill')}
              aria-label={t('shareBill')}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 md:p-8 bg-white text-slate-900 selection:bg-amber-100">
          {/* Cancelled Stamp if applicable */}
          {bill.status === 'cancelled' && (
            <div className="mb-4 p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>BILL CANCELLED</span>
              </div>
              <div className="text-[11px] text-rose-600 text-right">
                <div>By: {bill.cancelledByName}</div>
                <div>Reason: {bill.cancellationReason}</div>
              </div>
            </div>
          )}

          {/* Shop Header with Logo and Bilingual Contact Info */}
          <div className="receipt-header text-center pb-4 border-b border-dashed border-slate-300">
            {bill.shopSnapshot.logoUrl ? (
              <img
                src={bill.shopSnapshot.logoUrl}
                alt="Sadhukhan Varities Logo"
                className="receipt-logo w-16 h-16 mx-auto mb-2 object-contain"
              />
            ) : (
              <div className="receipt-logo w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-xs print:bg-slate-900 print:text-white">
                SV
              </div>
            )}
            
            <h1 id="receipt-title" className="text-xl font-black tracking-tight text-slate-900 print:text-black">
              {bill.shopSnapshot.shopName || 'Sadhukhan Varities'}
            </h1>
            <div className="text-sm font-bold text-slate-800 print:text-black font-bengali">
              সাধুখাঁ ভ্যারাইটিজ
            </div>
            
            <div className="mt-1 text-xs text-slate-700 print:text-black font-medium">
              Proprietor: <span className="font-semibold">{bill.shopSnapshot.adminName || 'Subodh Sadhukhan'}</span> · <span className="font-bengali">স্বত্বাধিকারী: সুবোধ সাধুখাঁ</span>
            </div>

            {/* Bilingual Address & Contact Info */}
            <div className="mt-1.5 space-y-0.5 text-xs text-slate-600 print:text-black">
              <div className="receipt-address-en leading-tight">
                {bill.shopSnapshot.address || 'Station Road, Barasat, North 24 Parganas, West Bengal 700124'}
              </div>
              <div className="receipt-address-bn text-[11px] leading-tight font-bengali text-slate-600 print:text-black">
                স্টেশন রোড, বারাসাত, উত্তর ২৪ পরগণা, পশ্চিমবঙ্গ ৭০০১২৪
              </div>
              <div className="receipt-contact font-mono text-xs font-semibold text-slate-800 print:text-black mt-1">
                Phone / ফোন: +91 {bill.shopSnapshot.mobile || '98300 12345'}
              </div>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 py-3 text-xs border-b border-dashed border-slate-300">
            <div>
              <span className="text-slate-500">Bill No / বিল নং:</span>{' '}
              <span className="font-mono font-bold text-slate-900 print:text-black">{bill.billNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Date / তারিখ:</span>{' '}
              <span className="font-medium text-slate-900 print:text-black">{new Date(bill.billDate).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Billed By:</span>{' '}
              <span className="font-medium text-slate-900 print:text-black">{bill.createdByName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Payment:</span>{' '}
              <span className="font-bold uppercase text-slate-900 print:text-black">{bill.paymentMethod}</span>
            </div>
            {bill.customerName && (
              <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between">
                <div>
                  <span className="text-slate-500">Customer / গ্রাহক:</span>{' '}
                  <span className="font-bold text-slate-900 print:text-black">{bill.customerName}</span>
                </div>
                {bill.customerMobile && (
                  <div className="font-mono text-slate-700 print:text-black">
                    Ph: {bill.customerMobile}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Table - Clean Borderless Layout */}
          <div className="py-3">
            <table className="receipt-table w-full text-xs">
              <thead>
                <tr className="receipt-table-header text-slate-600 print:text-black">
                  <th className="text-left py-2 px-1 font-bold">Item / বিবরণ</th>
                  <th className="text-center py-2 px-1 font-bold">Qty / পরিমাণ</th>
                  <th className="text-right py-2 px-1 font-bold">Rate / দর</th>
                  <th className="text-right py-2 px-1 font-bold">Amount / মূল্য</th>
                </tr>
              </thead>
              <tbody className="receipt-table-body">
                {bill.items.map((it, idx) => (
                  <tr key={idx} className="receipt-row">
                    <td className="py-1.5 px-1 pr-2 align-top">
                      <div className="font-semibold text-slate-900 print:text-black">{it.productName}</div>
                      <div className="text-[10px] text-slate-500 print:text-slate-700">Unit: {it.unit}</div>
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono align-top text-slate-800 print:text-black">{it.quantity}</td>
                    <td className="py-1.5 px-1 text-right font-mono align-top text-slate-800 print:text-black">₹{it.unitPrice}</td>
                    <td className="py-1.5 px-1 text-right font-mono font-bold align-top text-slate-900 print:text-black">₹{it.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="pt-2 border-t-2 border-slate-900 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹{bill.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span className="font-sans">Grand Total:</span>
              <span>₹{bill.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Paid Amount:</span>
              <span className="text-emerald-700 font-bold">₹{bill.paidAmount.toFixed(2)}</span>
            </div>
            {bill.dueAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1 rounded">
                <span>Remaining Due:</span>
                <span>₹{bill.dueAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer & UPI QR */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center">
            {bill.shopSnapshot.upiQrUrl ? (
              <div className="mb-2">
                <img
                  src={bill.shopSnapshot.upiQrUrl}
                  alt="UPI QR"
                  className="w-24 h-24 mx-auto object-contain border p-1 rounded-md"
                />
                <div className="text-[10px] text-slate-500 mt-0.5">Scan & Pay via UPI</div>
              </div>
            ) : bill.shopSnapshot.upiId ? (
              <div className="text-[11px] text-slate-600 font-mono mb-2">
                UPI ID: <span className="font-bold">{bill.shopSnapshot.upiId}</span>
              </div>
            ) : null}
            <div className="text-xs font-semibold text-slate-800">Thank you for visiting Sadhukhan Varities!</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Please visit again · Goods once sold are subject to shop terms</div>
          </div>
        </div>
      </div>
    </div>
  );
};
