import React, { useState, useEffect } from 'react';
import {
  BadgeAlert,
  Search,
  Plus,
  DollarSign,
  Camera,
  History,
  CheckCircle,
  Eye,
  X,
  Check,
  Phone,
  Image as ImageIcon
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { CameraProofModal } from '../components/CameraProofModal';

interface DueRecord {
  customerId: string;
  customerName: string;
  customerMobile: string;
  totalBillAmount: number;
  totalPaid: number;
  remainingDue: number;
  billsCount: number;
  lastBillDate: string;
  bills: any[];
  payments: any[];
}

export const DuePaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { success, error } = useToast();

  const [dueRecords, setDueRecords] = useState<DueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Payment Recording Modal
  const [selectedRecord, setSelectedRecord] = useState<DueRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History / View Modal
  const [viewHistoryRecord, setViewHistoryRecord] = useState<DueRecord | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  useEffect(() => {
    loadDues();
  }, [search]);

  const loadDues = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ dueRecords: DueRecord[] }>(
        `/payments/dues?search=${encodeURIComponent(search)}`
      );
      setDueRecords(res.dueRecords || []);
    } catch (err: any) {
      error('Failed to load due records');
    } finally {
      setLoading(false);
    }
  };

  const openRecordPayment = (record: DueRecord) => {
    setSelectedRecord(record);
    setPaymentAmount(String(record.remainingDue));
    setPaymentMethod('cash');
    setPaymentNote('');
    setProofPhotos([]);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !paymentAmount || Number(paymentAmount) <= 0) {
      error('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = Number(paymentAmount);
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedRecord.customerId,
          customerName: selectedRecord.customerName,
          customerMobile: selectedRecord.customerMobile,
          amount,
          paymentMethod,
          proofImages: proofPhotos,
          note: paymentNote
        })
      });

      success(`Payment of ₹${amount} recorded successfully.`);
      setSelectedRecord(null);
      loadDues();
    } catch (err: any) {
      error(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BadgeAlert className="w-6 h-6 text-amber-500" />
            <span>{t('dueRecordsTitle')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer dues, record partial or full settlements, and capture payment receipts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Due Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Mobile</th>
                <th className="py-3 px-3 font-semibold text-right">Total Billed</th>
                <th className="py-3 px-3 font-semibold text-right">Total Paid</th>
                <th className="py-3 px-3 font-semibold text-right">Remaining Due</th>
                <th className="py-3 px-3 font-semibold">Bills Count</th>
                <th className="py-3 px-3 font-semibold">Last Bill Date</th>
                <th className="py-3 px-4 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dueRecords.map(rec => (
                <tr key={rec.customerMobile} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {rec.customerName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {rec.customerMobile}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    ₹{rec.totalBillAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                    ₹{rec.totalPaid.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {rec.remainingDue > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 text-sm">
                        ₹{rec.remainingDue.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-emerald-600">Settled (₹0)</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {rec.billsCount} bills
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">
                    {new Date(rec.lastBillDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewHistoryRecord(rec)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1"
                        title="View Payment History"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">History</span>
                      </button>

                      {rec.remainingDue > 0 && (
                        <button
                          onClick={() => openRecordPayment(rec)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('recordPayment')}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dueRecords.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
            <p className="text-sm font-semibold">{t('noDues')}</p>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payment-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="record-payment-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <span>{t('recordPayment')}</span>
              </h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Summary Banner */}
            <div className="my-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {selectedRecord.customerName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {selectedRecord.customerMobile}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-amber-800 dark:text-amber-300">Total Outstanding</div>
                <div className="text-base font-bold font-mono text-amber-700 dark:text-amber-400">
                  ₹{selectedRecord.remainingDue.toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedRecord.remainingDue}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    UPI
                  </button>
                </div>
              </div>

              {/* Payment Proof Photos Button (Camera / File) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Proof Photos
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="text-amber-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{proofPhotos.length > 0 ? `Change/Add (${proofPhotos.length})` : 'Take Photo / Upload'}</span>
                  </button>
                </div>
                {proofPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {proofPhotos.map((img, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border aspect-square">
                        <img src={img} alt="Proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProofPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="e.g. Paid in cash by brother Bikash"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {viewHistoryRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-history-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 id="payment-history-title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>Payment History · {viewHistoryRecord.customerName}</span>
              </h2>
              <button
                onClick={() => setViewHistoryRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {viewHistoryRecord.payments.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No additional payments recorded yet for this customer.
                </div>
              ) : (
                viewHistoryRecord.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{p.amount.toFixed(2)}
                      </span>
                      <span className="uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                        {p.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Date: {new Date(p.paymentDate || p.createdAt).toLocaleString()}</span>
                      <span>By: {p.createdByName}</span>
                    </div>
                    {p.note && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                        "{p.note}"
                      </div>
                    )}
                    {p.proofImages && p.proofImages.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                          <ImageIcon className="w-3 h-3" />
                          Proof Photos:
                        </span>
                        {p.proofImages.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt="Proof"
                            onClick={() => setPhotoViewerUrl(img)}
                            className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80 border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {photoViewerUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <div className="relative max-w-xl max-h-[90vh]">
            <img src={photoViewerUrl} alt="Payment Proof" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
            <button
              onClick={() => setPhotoViewerUrl(null)}
              className="absolute top-2 right-2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-lg"
              aria-label="Close photo preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Camera Proof Modal */}
      <CameraProofModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={imgs => setProofPhotos(prev => [...prev, ...imgs])}
      />
    </div>
  );
};
