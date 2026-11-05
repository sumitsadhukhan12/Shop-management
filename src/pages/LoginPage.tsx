import React, { useState } from 'react';
import { Lock, Phone, Mail, ShieldCheck, UserCheck, KeyRound, ArrowRight, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { success, error } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      error('Please enter your mobile number or email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier, password);
      success('Logged in successfully!');
    } catch (err: any) {
      error(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setIdentifier('9830012345');
      setPassword('Admin@123');
    } else {
      setIdentifier('9876543210');
      setPassword('Staff@123');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier || !newPassword) {
      error('Please fill in all reset fields.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await apiRequest<{ message: string }>('/auth/reset-password-verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: resetIdentifier,
          verificationCode,
          newPassword
        })
      });
      success(res.message);
      setShowForgotModal(false);
      setIdentifier(resetIdentifier);
      setPassword(newPassword);
    } catch (err: any) {
      error(err.message || 'Password reset failed.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      {/* Top language selector */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
        >
          {language === 'en' ? 'বাংলা' : 'English'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
          SV
        </div>
        <h1 className="mt-4 text-center text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('shopName')}
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          {t('shopTagline')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Mobile Number or Email
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. 9830012345 or admin@sadhukhan.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 font-bold text-sm rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development Quick Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Development Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 text-xs text-left rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Subodh Sadhukhan</div>
                <div className="text-[10px] text-slate-400 font-mono">9830012345</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="p-2.5 text-xs text-left rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-emerald-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Staff</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Staff Account</div>
                <div className="text-[10px] text-slate-400 font-mono">9876543210</div>
              </button>
            </div>
            <div className="mt-2 text-[11px] text-center text-slate-400">
              {t('inactivityNotice')}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-heading"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 id="reset-modal-heading" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Reset Account Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter your registered mobile or email and verification OTP (Demo OTP: 123456).
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Registered Mobile / Email
                </label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={e => setResetIdentifier(e.target.value)}
                  placeholder="9830012345 or admin@sadhukhan.com"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
