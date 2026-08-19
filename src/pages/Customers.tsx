import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, Phone, MessageCircle, AlertTriangle, Download, ArrowRight, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { Customer, CustomerSummary, ShopSettings } from '../types';
import { backupService } from '../services/backupService';
import { customerService } from '../services/customerService';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, formatDateOnly } from '../utils/dates';

interface CustomersProps {
  settings: ShopSettings;
  onOpenNewCustomer: () => void;
  onSelectCustomer: (customerId: number) => void;
  onRecordPaymentForCustomer: (customer: Customer) => void;
  onCreateSaleForCustomer: (customerId: number) => void;
  refreshTrigger: number;
}

export const Customers: React.FC<CustomersProps> = ({
  settings,
  onOpenNewCustomer,
  onSelectCustomer,
  onRecordPaymentForCustomer,
  onCreateSaleForCustomer,
  refreshTrigger
}) => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'settled'>('all');

  useEffect(() => {
    loadCustomers();
  }, [refreshTrigger]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const list = await customerService.getSummaries();
      setCustomers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (filterType === 'debtors' && c.outstandingBalance <= 0) return false;
      if (filterType === 'settled' && c.outstandingBalance > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesAddress = (c.address || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAddress) return false;
      }

      return true;
    });
  }, [customers, filterType, searchQuery]);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const totalDebtorsCount = customers.filter(c => c.outstandingBalance > 0).length;

  const handleExportCSV = () => {
    backupService.exportCustomersCSV();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Bento Tile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#173B6C] flex items-center justify-center border border-sky-100">
              <Users className="w-5 h-5" />
            </div>
            Customer Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Individual client balances, purchase histories, and contact ledger.
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
            id="customers-page-add-btn"
            onClick={onOpenNewCustomer}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#173B6C] to-[#2F6DB2] hover:opacity-95 rounded-xl shadow-sm shadow-[#173B6C]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> + Add Customer
          </button>
        </div>
      </div>

      {/* Overview Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
          <div className="text-2xl font-black text-slate-900">{customers.length}</div>
          <p className="text-[11px] text-slate-400 font-medium">Regular shop patrons</p>
        </div>

        <div className="bg-rose-50/80 p-5 rounded-3xl border border-rose-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Total Credit Outstanding
          </span>
          <div className="text-2xl font-black text-rose-700">
            {formatCurrency(totalOutstanding, settings.currency)}
          </div>
          <p className="text-[11px] text-rose-600 font-medium">{totalDebtorsCount} customers have active credit</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settled Accounts</span>
          <div className="text-2xl font-black text-emerald-700">
            {customers.length - totalDebtorsCount}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">0 pending debt</p>
        </div>
      </div>

      {/* Filter & Search Bento Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, phone, address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 focus:border-[#173B6C] focus:bg-white focus:ring-1 focus:ring-[#173B6C] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#173B6C] text-white shadow-2xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('debtors')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              filterType === 'debtors'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Debtors Only ({totalDebtorsCount})
          </button>
          <button
            onClick={() => setFilterType('settled')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterType === 'settled'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Settled ({customers.length - totalDebtorsCount})
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-14 text-center rounded-3xl border border-slate-200/80 text-slate-400 text-xs">
            No customers found matching the search criteria.
          </div>
        ) : (
          filteredCustomers.map(cust => {
            const hasDebt = cust.outstandingBalance > 0;
            return (
              <div
                key={cust.id}
                onClick={() => cust.id && onSelectCustomer(cust.id)}
                className={`bg-white rounded-3xl border p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] cursor-pointer transition-all space-y-3.5 relative overflow-hidden ${
                  hasDebt ? 'border-rose-200/90 hover:border-rose-300' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {hasDebt && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-extrabold uppercase px-3 py-0.5 rounded-bl-xl">
                    Has Balance
                  </div>
                )}

                <div className="space-y-1 pr-14">
                  <h3 className="font-black text-sm text-slate-900">{cust.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>📞 {cust.phone || 'No phone'}</span>
                  </div>
                  {cust.address && (
                    <div className="text-[11px] text-slate-400 truncate">
                      📍 {cust.address}
                    </div>
                  )}
                </div>

                {/* Balances summary */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Purchased</span>
                    <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                      {formatCurrency(cust.totalPurchases, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Paid</span>
                    <span className="font-bold text-emerald-700 text-[11px] block mt-0.5">
                      {formatCurrency(cust.totalPaid, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
                    <span className={`font-black text-[11px] block mt-0.5 ${hasDebt ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatCurrency(cust.outstandingBalance, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {cust.phone && (
                      <a
                        href={`https://wa.me/${cust.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${cust.name}, this is ${settings.shopName}. Your current outstanding balance is ${formatCurrency(cust.outstandingBalance, settings.currency)}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors border border-emerald-100"
                        title="Send WhatsApp Balance Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onRecordPaymentForCustomer(cust);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      + Payment
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        if (cust.id) onCreateSaleForCustomer(cust.id);
                      }}
                      className="px-2.5 py-1 bg-[#173B6C] hover:bg-[#2F6DB2] text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      + Sale
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-0.5">
                    Ledger <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
