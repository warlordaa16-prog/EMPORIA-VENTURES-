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
  Layers,
  LogOut,
  UserCheck,
  ShieldCheck,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { ShopSettings, User } from '../types';
import { BRAND_CONFIG } from '../constants/branding';
import { productService } from '../services/productService';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  settings: ShopSettings;
  currentUser: User | null;
  onOpenNewSale: () => void;
  onOpenRecordPayment: () => void;
  onLogout: () => void;
  onOpenArchitecture: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  settings,
  currentUser,
  onOpenNewSale,
  onOpenRecordPayment,
  onLogout,
  onOpenArchitecture
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check low stock count for nav badge
    const checkStock = async () => {
      try {
        const low = await productService.getLowStockProducts();
        setLowStockCount(low.length);
      } catch (err) {
        // quiet fallback
      }
    };
    checkStock();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeTab]);

  const isOwner = currentUser?.role === 'owner';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, ownerOnly: false },
    { id: 'customers', label: 'Customers', icon: Users, ownerOnly: false },
    { id: 'payments', label: 'Payments', icon: CreditCard, ownerOnly: false },
    { id: 'reports', label: 'Reports', icon: FileText, ownerOnly: true },
    { id: 'products', label: 'Items & Stock', icon: Package, ownerOnly: false, badge: lowStockCount > 0 ? `${lowStockCount}` : undefined },
    { id: 'settings', label: 'Settings & Backup', icon: SettingsIcon, ownerOnly: true },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col antialiased relative selection:bg-[#173B6C] selection:text-white">
      {/* Light watermark in the background */}
      <div 
        className="fixed right-[-40px] bottom-[-40px] md:right-10 md:bottom-10 w-72 sm:w-96 md:w-[480px] h-72 sm:h-96 md:h-[480px] opacity-[0.03] pointer-events-none select-none z-0 bg-contain bg-no-repeat bg-center mix-blend-multiply"
        style={{ backgroundImage: `url(${BRAND_CONFIG.logoUrl})` }}
        aria-hidden="true"
      />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Shop identity with Emporia Ventures Branding */}
          <div className="flex items-center gap-3">
            <img
              src={BRAND_CONFIG.logoUrl}
              alt="Emporia Ventures"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200/80 bg-slate-50"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 tracking-tight">
                  {settings.shopName || BRAND_CONFIG.shopName}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider hidden xs:inline">
                  Official Shop
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline truncate max-w-[240px] block">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </div>

          {/* Center / Right controls: Network status, User role, Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Architecture Inspector Trigger */}
            <button
              onClick={onOpenArchitecture}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Inspect System Architecture Topology"
            >
              <Layers className="w-3.5 h-3.5 text-[#173B6C]" />
              <span>Architecture</span>
            </button>

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

            {/* Authenticated User & Validated Role Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-slate-700 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isOwner ? 'bg-amber-500' : 'bg-sky-500'}`}></span>
              <span className="hidden sm:inline font-bold text-slate-900">{currentUser?.fullName || 'User'}</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  isOwner
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-sky-100 text-sky-900 border-sky-300'
                }`}
              >
                {currentUser?.role || 'Guest'}
              </span>
              {/* Logout / Switch User Button */}
              <button
                onClick={onLogout}
                className="ml-1 p-1 hover:bg-slate-200/80 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Switch User / Logout to Login Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Record Sale Button */}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex py-6 gap-6 relative z-10">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Navigation</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentUser?.role?.toUpperCase()}
              </span>
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isRestricted = item.ownerOnly && !isOwner;

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] text-white shadow-sm shadow-[#173B6C]/25 font-black'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-200' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.badge && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isRestricted && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-bold border border-slate-200 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Owner
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shop branding info card in sidebar */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#173B6C] text-white rounded-2xl p-4 shadow-sm border border-slate-700/50 space-y-2.5 mt-auto overflow-hidden relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Emporia System
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-xs font-bold text-slate-100">
              {settings.shopName || BRAND_CONFIG.shopName}
            </div>
            <div className="text-[11px] text-slate-300/80 leading-relaxed">
              Currency: <strong className="text-white bg-white/15 px-1.5 py-0.5 rounded text-xs">{settings.currency}</strong>
            </div>
            <button
              onClick={onOpenArchitecture}
              className="w-full mt-1 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 font-bold text-[10px] rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Layers className="w-3 h-3" /> Inspect Architecture
            </button>
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">More Tools & Navigation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-700 font-bold uppercase">
                  {currentUser?.role}
                </span>
              </div>
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
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-slate-900 block">Item Catalog</span>
                  {lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-black rounded">
                      {lowStockCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">Stock & thresholds</span>
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
                  onOpenArchitecture();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left space-y-1"
              >
                <Layers className="w-5 h-5 text-sky-700" />
                <span className="font-bold text-xs text-slate-900 block">Architecture</span>
                <span className="text-[10px] text-slate-400">Inspect system stack</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch User / Return to Login Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

