import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  FileText,
  Package,
  Settings as SettingsIcon,
  Plus,
  Wifi,
  WifiOff,
  Menu,
  X,
  Store,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { ShopSettings } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: ShopSettings;
  onOpenNewSale: () => void;
  onOpenRecordPayment: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  settings,
  onOpenNewSale,
  onOpenRecordPayment
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'products', label: 'Items / Catalog', icon: Package },
    { id: 'settings', label: 'Settings & Backup', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Shop identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#173B6C] to-[#2F6DB2] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-sky-950/10">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  ShopPay
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#173B6C] uppercase tracking-wider">
                  Offline PWA
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline truncate max-w-[220px] block">
                {settings.shopName}
              </span>
            </div>
          </div>

          {/* Center / Right controls: Network status, User role, Quick Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 border-amber-300/80'
              }`}
              title={isOnline ? 'Connected to Network' : 'Working 100% Offline via IndexedDB'}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Live Mode</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline Active</span>
                </>
              )}
            </div>

            {/* Active User Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-slate-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#2F6DB2]"></span>
              <span>{settings.activeRole === 'owner' ? settings.ownerName : settings.attendantName}</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase bg-white px-1.5 py-0.5 rounded-md border border-slate-200/60">
                {settings.activeRole}
              </span>
            </div>

            {/* Quick action buttons */}
            <button
              id="topbar-new-sale-btn"
              onClick={onOpenNewSale}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-[#173B6C]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] text-white shadow-sm shadow-[#173B6C]/25 font-black'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-200' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Shop summary bento card in sidebar */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#173B6C] text-white rounded-2xl p-4 shadow-sm border border-slate-700/50 space-y-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                Digital Cashbook
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-xs font-semibold text-slate-200">
              Currency: <strong className="text-white bg-white/15 px-1.5 py-0.5 rounded text-xs">{settings.currency}</strong>
            </div>
            <div className="text-[11px] text-slate-300/80 leading-relaxed">
              Fast offline database. Zero server latency. Real-time balance calculations.
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === 'dashboard' ? 'text-[#173B6C]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('sales')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === 'sales' ? 'text-[#173B6C]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Sales</span>
        </button>

        {/* Center Floating Plus Sale Button */}
        <div className="relative -top-5">
          <button
            id="mobile-floating-sale-btn"
            onClick={onOpenNewSale}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#173B6C] to-[#2F6DB2] text-white shadow-xl flex items-center justify-center transition-transform active:scale-95"
            title="Record New Sale"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => onTabChange('customers')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === 'customers' ? 'text-[#173B6C]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Customers</span>
        </button>

        <button
          onClick={() => onTabChange('payments')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            activeTab === 'payments' ? 'text-[#173B6C]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-5 h-5 mb-0.5" />
          <span>Payments</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            ['reports', 'products', 'settings'].includes(activeTab) ? 'text-[#173B6C]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">More Tools & Navigation</h3>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onTabChange('reports');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left space-y-1"
              >
                <FileText className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-xs text-slate-900 block">Reports & P&L</span>
                <span className="text-[10px] text-slate-400">Daily/Monthly metrics</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('products');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left space-y-1"
              >
                <Package className="w-5 h-5 text-purple-700" />
                <span className="font-bold text-xs text-slate-900 block">Item Catalog</span>
                <span className="text-[10px] text-slate-400">Default product prices</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('settings');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left space-y-1"
              >
                <SettingsIcon className="w-5 h-5 text-slate-700" />
                <span className="font-bold text-xs text-slate-900 block">Settings</span>
                <span className="text-[10px] text-slate-400">Shop info & currency</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('settings');
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left space-y-1"
              >
                <Store className="w-5 h-5 text-sky-700" />
                <span className="font-bold text-xs text-slate-900 block">Backup / Restore</span>
                <span className="text-[10px] text-slate-400">Export .json file</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
