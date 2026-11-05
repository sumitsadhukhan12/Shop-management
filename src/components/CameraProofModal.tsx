import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, RefreshCw } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface CameraProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (compressedDataUrls: string[]) => void;
}

export const CameraProofModal: React.FC<CameraProofModalProps> = ({
  isOpen,
  onClose,
  onCapture
}) => {
  const { t } = useLanguage();
  const { error } = useToast();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl } = await compressImage(file, 1200, 1200, 0.75);
        newImages.push(dataUrl);
      }
      setCapturedImages(prev => [...prev, ...newImages]);
    } catch (err: any) {
      error(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirm = () => {
    onCapture(capturedImages);
    setCapturedImages([]);
    onClose();
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 id="proof-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-500" />
            {t('paymentProofPhoto')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-amber-500/50 hover:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 transition-colors gap-2"
          >
            <Camera className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold">{t('takePhoto')}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 transition-colors gap-2"
          >
            <Upload className="w-6 h-6 text-slate-500" />
            <span className="text-xs font-semibold">{t('uploadPhoto')}</span>
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-amber-600 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Compressing and optimizing image...</span>
          </div>
        )}

        {/* Preview of captured images */}
        {capturedImages.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Attached Proofs ({capturedImages.length}):
            </div>
            <div className="grid grid-cols-3 gap-2">
              {capturedImages.map((src, idx) => (
                <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square">
                  <img src={src} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={capturedImages.length === 0}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Attach Proof ({capturedImages.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
