import React, { useState, useEffect } from 'react';
import { FileText, Calendar, TrendingUp, DollarSign, AlertTriangle, Download, Printer, ShoppingBag, CreditCard, PieChart } from 'lucide-react';
import { ReportStats, ShopSettings } from '../types';
import { reportService } from '../services/reportService';
import { formatCurrency } from '../utils/currency';

interface ReportsProps {
  settings: ShopSettings;
  refreshTrigger: number;
}

export const Reports: React.FC<ReportsProps> = ({ settings, refreshTrigger }) => {
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [topProducts, setTopProducts] = useState<{ description: string; quantity: number; revenue: number }[]>([]);
  const [topDebtors, setTopDebtors] = useState<{ customer: any; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [period, refreshTrigger]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [pStats, pTop, pDebtors] = await Promise.all([
        reportService.getStatsForPeriod(period),
        reportService.getTopSellingProducts(6),
        reportService.getTopDebtors(5)
      ]);
      setStats(pStats);
      setTopProducts(pTop);
      setTopDebtors(pDebtors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPaymentMethods = (stats?.cashReceived || 0) + (stats?.mobileMoneyReceived || 0) + (stats?.bankReceived || 0) + (stats?.otherReceived || 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#173B6C] flex items-center justify-center border border-sky-100">
              <FileText className="w-5 h-5" />
            </div>
            Business Reports & Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Local-first real-time cash flow, profit insights, and collection metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {(['today', 'yesterday', 'week', 'month', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white text-[#173B6C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'all' ? 'All-Time' : p}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Summary
          </button>
        </div>
      </div>

      {/* Main Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Sales ({stats?.periodLabel})</span>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats?.totalSales || 0, settings.currency)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{stats?.transactionCount || 0} invoices generated</p>
        </div>

        <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Net Cash Collected
          </span>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(stats?.paymentsReceived || 0, settings.currency)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Deposits and credit settlements</p>
        </div>

        <div className="bg-rose-50/80 p-5 rounded-3xl border border-rose-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Credit Generated
          </span>
          <div className="text-2xl font-black text-rose-700">
            {formatCurrency(stats?.outstandingCredit || 0, settings.currency)}
          </div>
          <p className="text-[11px] text-rose-600 font-medium">Unpaid debt from this period's sales</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settlement Ratio</span>
          <div className="text-2xl font-black text-[#173B6C]">
            {stats && stats.totalSales > 0
              ? `${Math.round((stats.paymentsReceived / stats.totalSales) * 100)}%`
              : '100%'}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Collected vs billed</p>
        </div>
      </div>

      {/* Breakdown grids: Payment Channels & Top Products Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Channels Received */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#173B6C]" /> Payment Methods Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Total: {formatCurrency(totalPaymentMethods, settings.currency)}</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700">💵 Cash</span>
                <span className="text-slate-900 font-black">{formatCurrency(stats?.cashReceived || 0, settings.currency)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${totalPaymentMethods > 0 ? ((stats?.cashReceived || 0) / totalPaymentMethods) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Mobile Money */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700">📱 Mobile Money (MTN / Airtel / M-Pesa)</span>
                <span className="text-slate-900 font-black">{formatCurrency(stats?.mobileMoneyReceived || 0, settings.currency)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${totalPaymentMethods > 0 ? ((stats?.mobileMoneyReceived || 0) / totalPaymentMethods) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700">🏦 Bank Transfer</span>
                <span className="text-slate-900 font-black">{formatCurrency(stats?.bankReceived || 0, settings.currency)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#173B6C] h-full rounded-full transition-all"
                  style={{ width: `${totalPaymentMethods > 0 ? ((stats?.bankReceived || 0) / totalPaymentMethods) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Other */}
            {stats && stats.otherReceived > 0 && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">💳 Other / Cheque</span>
                  <span className="text-slate-900 font-black">{formatCurrency(stats.otherReceived, settings.currency)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${totalPaymentMethods > 0 ? (stats.otherReceived / totalPaymentMethods) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products Bento Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-700" /> Best Selling Products (By Revenue)
            </h3>
            <span className="text-xs text-slate-400 font-semibold">All-time</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No items recorded yet.</div>
            ) : (
              topProducts.map((prod, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center border border-slate-200/60">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {prod.description}
                      </span>
                      <span className="text-[11px] text-slate-400">{prod.quantity} units sold</span>
                    </div>
                  </div>
                  <span className="font-black text-xs text-slate-900">
                    {formatCurrency(prod.revenue, settings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
