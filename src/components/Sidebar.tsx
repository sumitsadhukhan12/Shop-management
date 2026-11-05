import React from 'react';
import {
  LayoutDashboard,
  Search,
  Package,
  Layers,
  History,
  Receipt,
  FileText,
  BadgeAlert,
  Users,
  UserCheck,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export type NavTab =
  | 'dashboard'
  | 'quick-search'
  | 'products'
  | 'categories'
  | 'stock-status'
  | 'price-history'
  | 'new-bill'
  | 'bills'
  | 'due-payments'
  | 'customers'
  | 'users'
  | 'excel'
  | 'settings'
  | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile
}) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: NavTab) => `
    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
    ${
      currentTab === tab
        ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
    }
  `;

  const sectionHeadingClass = 'px-3.5 pt-5 pb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800 select-none">
      {/* Top Shop Info / Close for mobile */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-xs">
            SV
          </div>
          <div>
            <div className="font-bold text-sm text-white tracking-tight">{t('shopName')}</div>
            <div className="text-[11px] text-amber-400 font-medium">{t('adminName')}</div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {/* MAIN */}
        <div className={sectionHeadingClass}>Main</div>
        <button
          onClick={() => handleNav('dashboard')}
          className={`w-full ${navItemClass('dashboard')}`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>{t('navDashboard')}</span>
        </button>
        <button
          onClick={() => handleNav('quick-search')}
          className={`w-full ${navItemClass('quick-search')}`}
        >
          <Search className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{t('navQuickSearch')}</span>
        </button>

        {/* INVENTORY */}
        <div className={sectionHeadingClass}>{t('navInventory')}</div>
        <button
          onClick={() => handleNav('products')}
          className={`w-full ${navItemClass('products')}`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>{t('navProducts')}</span>
        </button>
        <button
          onClick={() => handleNav('categories')}
          className={`w-full ${navItemClass('categories')}`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>{t('navCategories')}</span>
        </button>
        <button
          onClick={() => handleNav('stock-status')}
          className={`w-full ${navItemClass('stock-status')}`}
        >
          <BadgeAlert className="w-4 h-4 shrink-0" />
          <span>{t('navStockStatus')}</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => handleNav('price-history')}
            className={`w-full ${navItemClass('price-history')}`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>{t('navPriceHistory')}</span>
          </button>
        )}

        {/* SALES & BILLING */}
        <div className={sectionHeadingClass}>{t('navSales')}</div>
        <button
          onClick={() => handleNav('new-bill')}
          className={`w-full ${navItemClass('new-bill')}`}
        >
          <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{t('navNewBill')}</span>
        </button>
        <button
          onClick={() => handleNav('bills')}
          className={`w-full ${navItemClass('bills')}`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>{t('navBills')}</span>
        </button>
        <button
          onClick={() => handleNav('due-payments')}
          className={`w-full ${navItemClass('due-payments')}`}
        >
          <BadgeAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{t('navDuePayments')}</span>
        </button>

        {/* MANAGEMENT */}
        <div className={sectionHeadingClass}>{t('navManagement')}</div>
        <button
          onClick={() => handleNav('customers')}
          className={`w-full ${navItemClass('customers')}`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>{t('navCustomers')}</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => handleNav('users')}
            className={`w-full ${navItemClass('users')}`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{t('navUsers')}</span>
          </button>
        )}

        {/* DATA & BACKUP (Admin Only) */}
        {isAdmin && (
          <>
            <div className={sectionHeadingClass}>{t('navData')}</div>
            <button
              onClick={() => handleNav('excel')}
              className={`w-full ${navItemClass('excel')}`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{t('excelTitle')}</span>
            </button>
          </>
        )}

        {/* SYSTEM */}
        <div className={sectionHeadingClass}>{t('navSystem')}</div>
        <button
          onClick={() => handleNav('settings')}
          className={`w-full ${navItemClass('settings')}`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>{t('navSettings')}</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => handleNav('audit')}
            className={`w-full ${navItemClass('audit')}`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{t('navAudit')}</span>
          </button>
        )}
      </nav>

      {/* Footer Shop Details */}
      <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-900/50">
        <div className="font-semibold text-slate-200">Sadhukhan Varities</div>
        <div className="truncate text-[11px] text-slate-400">Station Rd, Barasat</div>
        <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">📞 +91 98300 12345</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
