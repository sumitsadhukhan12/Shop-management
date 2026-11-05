import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export const ExcelPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const { success, error, warning } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Import State
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    message: string;
    totalRows: number;
    validCount: number;
    errors: { row: number; item: string; error: string }[];
    preview: any[];
  } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        Access restricted. Only Administrators can access Excel backup and import tools.
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await apiRequest<Blob>('/excel/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sadhukhan_Varities_Data_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Excel backup downloaded successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to export Excel backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await apiRequest<Blob>('/excel/template');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sadhukhan_Varities_Product_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('Import template downloaded.');
    } catch (err: any) {
      error('Failed to download template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidationResult(null);

    const reader = new FileReader();
    reader.onload = async evt => {
      const base64 = evt.target?.result as string;
      setFileBase64(base64);
      // Run validation preview
      validateExcelFile(base64);
    };
    reader.readAsDataURL(file);
  };

  const validateExcelFile = async (base64Data: string) => {
    setIsValidating(true);
    try {
      const res = await apiRequest<any>('/excel/import', {
        method: 'POST',
        body: JSON.stringify({ base64Data, commit: false })
      });
      setValidationResult(res);
      if (res.errors && res.errors.length > 0) {
        warning(`Detected ${res.errors.length} validation issues in file.`);
      } else {
        success('All rows validated successfully. Ready to import.');
      }
    } catch (err: any) {
      error(err.message || 'File validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!fileBase64) return;
    if (validationResult?.errors && validationResult.errors.length > 0) {
      error('Cannot import file with validation errors. Please resolve row errors first.');
      return;
    }

    setIsCommitting(true);
    try {
      const res = await apiRequest<any>('/excel/import', {
        method: 'POST',
        body: JSON.stringify({ base64Data: fileBase64, commit: true })
      });
      success(res.message);
      setFileBase64(null);
      setFileName(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      error(err.message || 'Import failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-amber-500" />
          <span>{t('excelTitle')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Download complete multi-sheet Excel backups or import product catalogs with row-by-row validation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('exportBackup')}
              </h3>
              <p className="text-xs text-slate-500">
                Exports Products, Categories, Price History, Customers, Bills, and Due Payments.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Security & Integrity:</div>
            <div>• Passwords and password hashes are strictly excluded.</div>
            <div>• Historical bill and price revision records are preserved.</div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Generating XLSX...' : 'Download Complete Backup (.xlsx)'}</span>
          </button>
        </div>

        {/* Template Section */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('downloadTemplate')}
              </h3>
              <p className="text-xs text-slate-500">
                Download pre-formatted spreadsheet template with sample product entries.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Expected Columns:</div>
            <div>• Name (English), Name (Bengali), Category, Selling Price, Unit, Stock Status, Location</div>
          </div>

          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download Product Import Template</span>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('uploadExcel')}
              </h3>
              <p className="text-xs text-slate-500">
                Upload your completed Excel file for row-by-row validation and preview before import.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Select Excel File</span>
          </button>
        </div>

        {fileName && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between">
            <div className="font-mono text-slate-700 dark:text-slate-300">
              Selected file: <span className="font-bold">{fileName}</span>
            </div>
            {isValidating && (
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Validating rows...
              </span>
            )}
          </div>
        )}

        {/* Validation Result View */}
        {validationResult && (
          <div className="space-y-4 pt-2">
            {/* Summary Banner */}
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                validationResult.errors.length === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {validationResult.errors.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span>{validationResult.message}</span>
              </div>
              <div className="font-mono">
                Total Rows: {validationResult.totalRows} | Valid: {validationResult.validCount} | Errors: {validationResult.errors.length}
              </div>
            </div>

            {/* Error Table if issues found */}
            {validationResult.errors.length > 0 && (
              <div className="border border-rose-200 dark:border-rose-900/40 rounded-xl overflow-hidden">
                <div className="p-3 bg-rose-100/50 dark:bg-rose-950/50 font-bold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Validation Errors by Row (Fix in Excel before importing):</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-rose-100 dark:divide-rose-900/30 text-xs">
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900">
                      <span className="font-mono font-bold text-rose-700">Row {err.row} ({err.item})</span>
                      <span className="text-rose-600">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview of valid items */}
            {validationResult.preview && validationResult.preview.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Import Preview (First {validationResult.preview.length} products):
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                      <tr>
                        <th className="p-2">English Name</th>
                        <th className="p-2">বাংলা নাম</th>
                        <th className="p-2 text-right">Selling Price</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validationResult.preview.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2 font-semibold text-slate-900 dark:text-white">{p.nameEn}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">{p.nameBn}</td>
                          <td className="p-2 text-right font-mono font-bold">₹{p.sellingPrice}</td>
                          <td className="p-2">{p.unit}</td>
                          <td className="p-2">{p.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Commit Button */}
            {validationResult.errors.length === 0 && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCommitImport}
                  disabled={isCommitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
                >
                  {isCommitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>{isCommitting ? 'Importing Products...' : 'Confirm & Commit Import to Inventory'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
