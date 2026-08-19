import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Plus, Search, Download, Banknote, Smartphone, Building2, Calendar, Eye } from 'lucide-react';
import { Payment, PaymentMethod, ShopSettings } from '../types';
import { backupService } from '../services/backupService';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, isDateWithinFilter } from '../utils/dates';

interface PaymentsProps {
  settings: ShopSettings;
  onOpenRecordPayment: () => void;
  refreshTrigger: number;
}

export const Payments: React.FC<PaymentsProps> = ({
  settings,
  onOpenRecordPayment,
  refreshTrigger
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadPayments();
  }, [refreshTrigger]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const list = await paymentService.getAll();
      setPayments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (!isDateWithinFilter(p.paymentDate, dateFilter, customStartDate, customEndDate)) {
        return false;
      }
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesCustomer = p.customerName.toLowerCase().includes(q);
        const matchesSaleId = (p.saleId || '').toLowerCase().includes(q);
        const matchesNotes = (p.notes || '').toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesSaleId && !matchesNotes) return false;
      }
      return true;
    });
  }, [payments, dateFilter, customStartDate, customEndDate, methodFilter, searchQuery]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    backupService.exportPaymentsCSV();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bento Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
            Payment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Full chronological log of all cash, mobile money, and bank collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100/90 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            id="payments-record-btn"
            onClick={onOpenRecordPayment}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm border border-emerald-400/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> + Record Payment
          </button>
        </div>
      </div>

      {/* Summary Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Collections</span>
          <span className="text-2xl font-black text-emerald-700 tracking-tight block mt-0.5">
            {formatCurrency(totalCollected, settings.currency)}
          </span>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">{filteredPayments.length} payment entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Collections</span>
          <span className="text-xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(
              filteredPayments.filter(p => p.paymentMethod === 'Cash').reduce((s, p) => s + p.amount, 0),
              settings.currency
            )}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Direct cash desk deposits</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Money & Bank</span>
          <span className="text-xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(
              filteredPayments.filter(p => p.paymentMethod !== 'Cash').reduce((s, p) => s + p.amount, 0),
              settings.currency
            )}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Digital transfer deposits</p>
        </div>
      </div>

      {/* Filter Bento Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Payment ID, customer, invoice..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden"
            />
          </div>

          <div className="sm:col-span-4">
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
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash Only</option>
              <option value="Mobile Money">Mobile Money Only</option>
              <option value="Bank">Bank Only</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

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

      {/* Table Bento Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Allocated To</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
                <th className="py-3.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {p.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.saleId ? (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-[#173B6C] border border-sky-100 font-mono text-[11px] font-bold">
                          {p.saleId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Account</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                      +{formatCurrency(p.amount, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
