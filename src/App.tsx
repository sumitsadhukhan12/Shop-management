import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { QuickSearchPage } from './pages/QuickSearchPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { StockStatusPage } from './pages/StockStatusPage';
import { PriceHistoryPage } from './pages/PriceHistoryPage';
import { NewBillPage } from './pages/NewBillPage';
import { BillsPage } from './pages/BillsPage';
import { DuePaymentsPage } from './pages/DuePaymentsPage';
import { CustomersPage } from './pages/CustomersPage';
import { UsersPage } from './pages/UsersPage';
import { ExcelPage } from './pages/ExcelPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditPage } from './pages/AuditPage';
import { QuickSearchModal } from './components/QuickSearchModal';
import { BillReceiptModal, BillReceiptData } from './components/BillReceiptModal';
import { ProductItem } from './utils/shopLogic';

const AppShell: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickSearchModalOpen, setQuickSearchModalOpen] = useState(false);
  const [selectedBillForModal, setSelectedBillForModal] = useState<BillReceiptData | null>(null);
  const [productToAddToBill, setProductToAddToBill] = useState<ProductItem | null>(null);

  // Global keyboard shortcut '/' to launch Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setQuickSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl animate-pulse">
          SV
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Loading Sadhukhan Varities...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectProductForBill = (product: ProductItem) => {
    setProductToAddToBill(product);
    setCurrentTab('new-bill');
    setQuickSearchModalOpen(false);
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={tab => setCurrentTab(tab)}
            onOpenQuickSearch={() => setQuickSearchModalOpen(true)}
            onViewBill={bill => setSelectedBillForModal(bill)}
          />
        );
      case 'quick-search':
        return (
          <QuickSearchPage
            onSelectProductForBill={handleSelectProductForBill}
          />
        );
      case 'products':
        return <ProductsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'stock-status':
        return <StockStatusPage />;
      case 'price-history':
        return <PriceHistoryPage />;
      case 'new-bill':
        return (
          <NewBillPage
            initialProductToAdd={productToAddToBill}
            onClearInitialProduct={() => setProductToAddToBill(null)}
          />
        );
      case 'bills':
        return <BillsPage />;
      case 'due-payments':
        return <DuePaymentsPage />;
      case 'customers':
        return <CustomersPage />;
      case 'users':
        return <UsersPage />;
      case 'excel':
        return <ExcelPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit':
        return <AuditPage />;
      default:
        return (
          <DashboardPage
            onNavigate={tab => setCurrentTab(tab)}
            onOpenQuickSearch={() => setQuickSearchModalOpen(true)}
            onViewBill={bill => setSelectedBillForModal(bill)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        onOpenQuickSearch={() => setQuickSearchModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => setCurrentTab(tab)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={quickSearchModalOpen}
        onClose={() => setQuickSearchModalOpen(false)}
        onSelectProductForBill={handleSelectProductForBill}
      />

      {/* Global Bill Receipt Modal */}
      {selectedBillForModal && (
        <BillReceiptModal
          bill={selectedBillForModal}
          isOpen={Boolean(selectedBillForModal)}
          onClose={() => setSelectedBillForModal(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
