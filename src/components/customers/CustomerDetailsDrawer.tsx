import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, PlusCircle, ShoppingBag, CreditCard, Trash2, Edit3, X, Calendar } from 'lucide-react';
import { Customer, Payment, Sale, ShopSettings } from '../../types';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime, formatDateOnly } from '../../utils/dates';
import { StatusBadge } from '../ui/StatusBadge';

interface CustomerDetailsDrawerProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onEditCustomer: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
  onCreateSaleForCustomer: (customerId: number) => void;
  onViewSale: (sale: Sale) => void;
  onRefresh: () => void;
}

export const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  customerId,
  isOpen,
  onClose,
  settings,
  onEditCustomer,
  onRecordPayment,
  onCreateSaleForCustomer,
  onViewSale,
  onRefresh
}) => {
  const [ledger, setLedger] = useState<{
    customer: Customer;
    sales: Sale[];
    payments: Payment[];
    totalPurchases: number;
    totalPaid: number;
    outstandingBalance: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      loadLedger(customerId);
    }
  }, [isOpen, customerId]);

  const loadLedger = async (id: number) => {
    setLoading(true);
    try {
      const data = await customerService.getCustomerLedger(id);
      setLedger(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ledger?.customer.id) return;
    if (!confirm(`Are you sure you want to delete customer ${ledger.customer.name}? Their transaction history will remain.`)) {
      return;
    }
    await customerService.delete(ledger.customer.id);
    onRefresh();
    onClose();
  };

  if (!isOpen || !customerId) return null;

  const customer = ledger?.customer;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Customer Account</span>
            <h2 className="text-xl font-bold tracking-tight">{customer?.name || 'Loading...'}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {customer?.phone && <span>📞 {customer.phone}</span>}
              {customer?.address && <span>📍 {customer.address}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Balance Highlights */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Total Purchases</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {formatCurrency(ledger?.totalPurchases || 0, settings.currency)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Total Paid</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700">
              {formatCurrency(ledger?.totalPaid || 0, settings.currency)}
            </span>
          </div>

          <div className={`p-2.5 rounded-lg border shadow-2xs ${(ledger?.outstandingBalance || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Outstanding Debt</span>
            <span className={`text-sm sm:text-base font-extrabold ${(ledger?.outstandingBalance || 0) > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {formatCurrency(ledger?.outstandingBalance || 0, settings.currency)}
            </span>
          </div>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {customer?.phone && (
              <>
                <a
                  href={`tel:${customer.phone.replace(/[^0-9+]/g, '')}`}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-700" /> Call
                </a>
                <a
                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${customer.name}, this is ${settings.shopName}. Your current outstanding balance is ${formatCurrency(ledger?.outstandingBalance || 0, settings.currency)}. Thank you!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {customer && (
              <>
                <button
                  type="button"
                  onClick={() => onRecordPayment(customer)}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> + Payment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateSaleForCustomer(customer.id!);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-[#173B6C] hover:bg-[#2F6DB2] text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> + Sale
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-sky-700 text-sky-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Sales History ({ledger?.sales.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-sky-700 text-sky-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payment Ledger ({ledger?.payments.length || 0})
          </button>
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'sales' && (
            <>
              {ledger?.sales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No sales recorded for this customer yet.
                </div>
              ) : (
                ledger?.sales.map(s => (
                  <div
                    key={s.id}
                    onClick={() => onViewSale(s)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-all shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{s.id}</span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{formatDateOnly(s.saleDate)}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(s.total, settings.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-1">
                      <span>Paid: {formatCurrency(s.amountPaid, settings.currency)}</span>
                      <span className={s.balance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700'}>
                        Balance: {formatCurrency(s.balance, settings.currency)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'payments' && (
            <>
              {ledger?.payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No payments recorded for this customer yet.
                </div>
              ) : (
                ledger?.payments.map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{p.id}</span>
                      <span className="text-xs font-bold text-emerald-700">
                        +{formatCurrency(p.amount, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDateTime(p.paymentDate)}</span>
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </div>
                    {p.notes && <p className="text-[11px] text-slate-600 italic">"{p.notes}"</p>}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {customer && (
            <button
              type="button"
              onClick={() => onEditCustomer(customer)}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Info
            </button>
          )}

          {settings.activeRole === 'owner' && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
