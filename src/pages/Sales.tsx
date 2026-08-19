import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Download, Calendar, ArrowUpDown, Eye, CheckCircle, AlertCircle, ShoppingBag } from 'lucide-react';
import { PaymentMethod, PaymentStatus, Sale, ShopSettings } from '../types';
import { backupService } from '../services/backupService';
import { salesService } from '../services/salesService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, formatDateOnly, isDateWithinFilter } from '../utils/dates';
import { StatusBadge } from '../components/ui/StatusBadge';

interface SalesProps {
  settings: ShopSettings;
  onOpenNewSale: () => void;
  onViewSale: (sale: Sale) => void;
  refreshTrigger: number;
}

export const Sales: React.FC<SalesProps> = ({
  settings,
  onOpenNewSale,
  onViewSale,
  refreshTrigger
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');

  useEffect(() => {
    loadSales();
  }, [refreshTrigger]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const all = await salesService.getAll();
      setSales(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Date filter
      if (!isDateWithinFilter(s.saleDate, dateFilter, customStartDate, customEndDate)) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }

      // Payment method filter
      if (paymentMethodFilter !== 'ALL' && s.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // Search query (Transaction ID, customer name, phone, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesName = s.customerName.toLowerCase().includes(q);
        const matchesPhone = (s.customerPhone || '').toLowerCase().includes(q);
        const matchesNotes = (s.notes || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [sales, dateFilter, customStartDate, customEndDate, statusFilter, paymentMethodFilter, searchQuery]);

  const totalFilteredVolume = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalFilteredPaid = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalFilteredBalance = filteredSales.reduce((sum, s) => sum + s.balance, 0);

  const handleExportCSV = () => {
    backupService.exportSalesCSV();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#173B6C] flex items-center justify-center border border-sky-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            Sales Transactions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every transaction receives a unique ID (SP-XXXXXX) with automatic balance calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV report of sales"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            id="sales-page-new-sale-btn"
            onClick={onOpenNewSale}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 rounded-xl shadow-sm shadow-[#173B6C]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> + Record Sale
          </button>
        </div>
      </div>

      {/* Filter & Search Bento Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, customer name, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden"
            />
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-3">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">PAID (Full)</option>
              <option value="PARTIAL">PARTIAL (Partial payment)</option>
              <option value="CREDIT">CREDIT / UNPAID (0 Paid)</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-2">
            <select
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Bank">Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Custom date range picker if selected */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">Custom Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {/* Summary Bento KPI Cards of filtered result */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtered Total</span>
          <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(totalFilteredVolume, settings.currency)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected</span>
          <span className="text-base sm:text-xl font-black text-emerald-700 block mt-0.5">
            {formatCurrency(totalFilteredPaid, settings.currency)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
          <span className={`text-base sm:text-xl font-black block mt-0.5 ${totalFilteredBalance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(totalFilteredBalance, settings.currency)}
          </span>
        </div>
      </div>

      {/* Sales Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Sale ID</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Method</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400">
                    No transactions matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr
                    key={sale.id}
                    onClick={() => onViewSale(sale)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#173B6C] whitespace-nowrap">
                      {sale.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(sale.saleDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-[11px] text-slate-400">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(sale.total, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-bold whitespace-nowrap">
                      {formatCurrency(sale.amountPaid, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {sale.balance > 0 ? (
                        <span className="font-black text-rose-600">
                          {formatCurrency(sale.balance, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={sale.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSale(sale);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-[#173B6C] hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredSales.length} of {sales.length} transactions</span>
          <span>IndexedDB storage</span>
        </div>
      </div>
    </div>
  );
};
