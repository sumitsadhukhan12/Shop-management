import React from 'react';
import { Search, Moon, Sun, Globe, LogOut, Menu, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenQuickSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenQuickSearch
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg shadow-sm">
            SV
          </div>
          <div>
            <div className="font-bold text-base md:text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {t('shopName')}
            </div>
            <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 leading-tight">
              {t('shopTagline')}
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Quick Search Button */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={onOpenQuickSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-amber-500" />
            <span className="truncate">{t('quickSearchPlaceholder')}</span>
          </div>
          <kbd className="hidden lg:inline-block px-2 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            /
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Mobile Quick Search Icon */}
        <button
          onClick={onOpenQuickSearch}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={t('quickSearch')}
        >
          <Search className="w-5 h-5 text-amber-500" />
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Switch Language / ভাষা পরিবর্তন"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Dark/Light Mode */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Role Indicator */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {user?.name}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1">
              {isAdmin ? (
                <ShieldCheck className="w-3 h-3 text-amber-500" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-500" />
              )}
              <span>{isAdmin ? t('roleAdmin') : t('roleStaff')}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
          }}
          className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
          title={t('logout')}
          aria-label={t('logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
