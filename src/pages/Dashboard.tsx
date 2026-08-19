import React, { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, AlertTriangle, TrendingUp, Plus, UserPlus, FileText, ArrowRight, Clock, Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import { CustomerSummary, Payment, ReportStats, Sale, ShopSettings } from '../types';
import { customerService } from '../services/customerService';
import { reportService } from '../services/reportService';
import { salesService } from '../services/salesService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, getRelativeDateLabel } from '../utils/dates';
import { StatusBadge } from '../components/ui/StatusBadge';

interface DashboardProps {
  settings: ShopSettings;
  onOpenNewSale: () => void;
  onOpenRecordPayment: () => void;
  onOpenNewCustomer: () => void;
  onViewSale: (sale: Sale) => void;
  onViewCustomer: (customerId: number) => void;
  onNavigate: (tab: string) => void;
  refreshTrigger: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  onOpenNewSale,
  onOpenRecordPayment,
  onOpenNewCustomer,
  onViewSale,
  onViewCustomer,
  onNavigate,
  refreshTrigger
}) => {
  const [todayStats, setTodayStats] = useState<ReportStats | null>(null);
  const [totalDebtors, setTotalDebtors] = useState<{ customer: any; balance: number }[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [stats, debtors, allSales] = await Promise.all([
        reportService.getStatsForPeriod('today'),
        reportService.getTopDebtors(4),
        salesService.getAll()
      ]);
      setTodayStats(stats);
      setTotalDebtors(debtors);
      setRecentSales(allSales.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const totalOutstandingAll = totalDebtors.reduce((sum, d) => sum + d.balance, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome greeting Bento Hero Block */}
      <div className="bg-gradient-to-br from-[#173B6C] via-[#1E4D8C] to-[#2F6DB2] text-white p-5 sm:p-7 rounded-3xl shadow-[0_4px_20px_-4px_rgba(23,59,108,0.25)] relative overflow-hidden border border-white/10">
        {/* Subtle decorative bento mesh overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-bold tracking-wider uppercase border border-white/10 text-sky-100">
                Offline Cashbook Engine
              </span>
              <span className="text-xs text-sky-200 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {settings.shopName}
            </h1>
            <p className="text-xs text-sky-100/90 max-w-md">
              Active Operator: <strong className="text-white font-bold">{settings.activeRole === 'owner' ? settings.ownerName : settings.attendantName}</strong>
              <span className="ml-2 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono uppercase tracking-wide">
                {settings.activeRole}
              </span>
            </p>
          </div>

          {/* Quick sale button in banner */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-quick-sale-button"
              type="button"
              onClick={onOpenNewSale}
              className="px-4 sm:px-5 py-2.5 bg-white text-[#173B6C] hover:bg-sky-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-black/10 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> + Record New Sale
            </button>
            <button
              id="dash-quick-payment-button"
              type="button"
              onClick={onOpenRecordPayment}
              className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm border border-emerald-400/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Primary Bento KPI Grid (4 main cards with distinct bento accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Sales</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#173B6C] flex items-center justify-center border border-sky-100">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(todayStats?.totalSales || 0, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <span className="font-medium">{todayStats?.transactionCount || 0} sales recorded today</span>
            </div>
          </div>
        </div>

        {/* Today's Payments Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash Collected</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {formatCurrency(todayStats?.paymentsReceived || 0, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <span>Cash in hand: <strong className="text-slate-700">{formatCurrency(todayStats?.cashReceived || 0, settings.currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* Outstanding Customer Credit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Credit Owed</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
              {formatCurrency(totalOutstandingAll, settings.currency)}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">
              <span>{totalDebtors.length} debtor accounts pending</span>
            </div>
          </div>
        </div>

        {/* Today's Invoices Status breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settlement Rate</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {todayStats?.paidCount || 0} Paid
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                {todayStats?.partialCount || 0} Partial
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                {todayStats?.creditCount || 0} Credit
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Auto-balanced digital ledger</div>
          </div>
        </div>
      </div>

      {/* Main Bento Split: Recent Transactions (Left) + Top Debtors & Quick Operations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions Bento Box */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#173B6C] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900">Recent Transactions</h2>
                <p className="text-[11px] text-slate-400">Live sales & payment log</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-[#173B6C] hover:text-[#2F6DB2] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
            >
              View All Sales <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No transactions recorded yet. Tap "+ Record New Sale" to start!
              </div>
            ) : (
              recentSales.map(sale => (
                <div
                  key={sale.id}
                  onClick={() => onViewSale(sale)}
                  className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#173B6C] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {sale.id}
                      </span>
                      <StatusBadge status={sale.status} size="sm" />
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-xs text-slate-800 font-bold truncate">
                      {sale.customerName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {getRelativeDateLabel(sale.saleDate)}
                    </div>
                  </div>

                  <div className="text-right whitespace-nowrap">
                    <span className="font-black text-sm text-slate-900 block">
                      {formatCurrency(sale.total, settings.currency)}
                    </span>
                    {sale.balance > 0 ? (
                      <span className="text-[11px] font-bold text-rose-600">
                        Owes: {formatCurrency(sale.balance, settings.currency)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold">Fully Paid</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {recentSales.length > 0 && (
            <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('sales')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Showing {recentSales.length} most recent sales · Click any to view digital receipt
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Col: Top Debtors & Quick Operations Bento Boxes */}
        <div className="space-y-6">
          {/* Debtors List Bento Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">Top Debtors</h3>
              </div>
              <button
                onClick={() => onNavigate('customers')}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 px-2 py-1 rounded hover:bg-rose-100/60 transition-colors cursor-pointer"
              >
                All Debtors →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {totalDebtors.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  🎉 No outstanding debtor balances!
                </div>
              ) : (
                totalDebtors.map(d => (
                  <div
                    key={d.customer.id}
                    onClick={() => onViewCustomer(d.customer.id)}
                    className="p-3.5 hover:bg-rose-50/30 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {d.customer.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.customer.phone || 'No phone'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xs text-rose-600 block">
                        {formatCurrency(d.balance, settings.currency)}
                      </span>
                      <span className="text-[10px] text-slate-400">View ledger →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations Bento Hub */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Operations
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenNewCustomer}
                className="p-3 bg-slate-50 hover:bg-sky-50/80 border border-slate-200/80 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#173B6C] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">+ Add Customer</span>
                <span className="text-[10px] text-slate-500">New client ledger</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">Reports & P&L</span>
                <span className="text-[10px] text-slate-500">Daily / Monthly stats</span>
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="p-3 bg-slate-50 hover:bg-purple-50/80 border border-slate-200/80 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">Item Catalog</span>
                <span className="text-[10px] text-slate-500">Product price list</span>
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className="p-3 bg-slate-50 hover:bg-amber-50/80 border border-slate-200/80 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 block">Backup & Sync</span>
                <span className="text-[10px] text-slate-500">Export / restore</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
