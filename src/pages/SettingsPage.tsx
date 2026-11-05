import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  QrCode,
  Shield,
  Upload,
  Check,
  Moon,
  Sun,
  Globe,
  FileText,
  Phone,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { compressImage } from '../utils/imageCompressor';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [shopName, setShopName] = useState('Sadhukhan Varities');
  const [adminName, setAdminName] = useState('Subodh Sadhukhan');
  const [address, setAddress] = useState('Station Road, Barasat, North 24 Parganas, West Bengal 700124');
  const [mobile, setMobile] = useState('9830012345');
  const [upiId, setUpiId] = useState('9830012345@upi');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [upiQrUrl, setUpiQrUrl] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ settings: any }>('/settings');
      if (res.settings) {
        setShopName(res.settings.shopName || 'Sadhukhan Varities');
        setAdminName(res.settings.adminName || 'Subodh Sadhukhan');
        setAddress(res.settings.address || '');
        setMobile(res.settings.mobile || '');
        setUpiId(res.settings.upiId || '');
        setLogoUrl(res.settings.logoUrl || null);
        setUpiQrUrl(res.settings.upiQrUrl || null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await compressImage(file, 400, 400, 0.85);
      setLogoUrl(dataUrl);
      success('Shop logo loaded. Click "Save Changes" to apply.');
    } catch (err: any) {
      error(err.message || 'Failed to process logo image');
    }
  };

  const handleUpiQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await compressImage(file, 600, 600, 0.85);
      setUpiQrUrl(dataUrl);
      success('UPI QR loaded. Click "Save Changes" to apply.');
    } catch (err: any) {
      error(err.message || 'Failed to process QR image');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      error('Only Administrators can modify shop settings.');
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          shopName,
          adminName,
          address,
          mobile,
          upiId,
          logoImage: logoUrl && logoUrl.startsWith('data:image/') ? logoUrl : undefined,
          upiQrImage: upiQrUrl && upiQrUrl.startsWith('data:image/') ? upiQrUrl : undefined
        })
      });
      success(t('savedSuccess'));
      loadSettings();
    } catch (err: any) {
      error(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-500" />
          <span>{t('shopSettingsTitle')}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure shop branding, contact information, billing QR code, and system preferences.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Shop Info Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-amber-500" />
            <span>General Shop Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Name *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop Owner / Admin Name *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('mobileNumber')} *
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop UPI ID (for billing receipt)
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('shopAddress')} *
              </label>
              <textarea
                rows={2}
                required
                disabled={!isAdmin}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Branding & QR Code Uploads */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <QrCode className="w-4 h-4 text-amber-500" />
            <span>Shop Branding & Payment QR</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Logo */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                {t('shopLogo')}
              </label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-contain border p-1 bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xl">
                    SV
                  </div>
                )}
                {isAdmin && (
                  <label className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* UPI QR */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                {t('upiQrCode')}
              </label>
              <div className="flex items-center gap-4">
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt="UPI QR"
                    className="w-20 h-20 rounded-xl object-contain border p-1 bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8 opacity-40" />
                  </div>
                )}
                {isAdmin && (
                  <label className="cursor-pointer px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpiQrUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences: Appearance & Language */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Theme */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{t('appearance')}</div>
                <div className="text-slate-400">{theme === 'dark' ? t('darkMode') : t('lightMode')}</div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>Toggle</span>
              </button>
            </div>

            {/* Language */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{t('language')}</div>
                <div className="text-slate-400">{language === 'en' ? 'English' : 'বাংলা (Bengali)'}</div>
              </div>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="px-3 py-1.5 font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Switch to {language === 'en' ? 'বাংলা' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : t('saveChanges')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
