import React, { useState, useEffect } from 'react';
import { Banknote, Smartphone, Building2, CreditCard, Check, AlertCircle } from 'lucide-react';
import { Customer, Payment, PaymentMethod, Sale } from '../../types';
import { customerService } from '../../services/customerService';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import confetti from 'canvas-confetti';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: (payment: Payment) => void;
  currency: string;
  targetCustomer?: Customer;
  targetSale?: Sale;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentRecorded,
  currency,
  targetCustomer,
  targetSale
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(targetCustomer?.id || targetSale?.customerId);
  const [customerName, setCustomerName] = useState<string>(targetCustomer?.name || targetSale?.customerName || '');
  const [amount, setAmount] = useState<number>(targetSale?.balance || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>(targetSale ? `Payment for ${targetSale.id}` : 'Debt settlement payment');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customerDebt, setCustomerDebt] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      loadInitial();
    }
  }, [isOpen, targetCustomer, targetSale]);

  const loadInitial = async () => {
    const custList = await customerService.getAll();
    setCustomers(custList);

    if (targetSale) {
      setSelectedCustomerId(targetSale.customerId);
      setCustomerName(targetSale.customerName);
      setAmount(targetSale.balance);
      setNotes(`Payment for ${targetSale.id}`);
      setCustomerDebt(targetSale.balance);
    } else if (targetCustomer?.id) {
      setSelectedCustomerId(targetCustomer.id);
      setCustomerName(targetCustomer.name);
      const ledger = await customerService.getCustomerLedger(targetCustomer.id);
      const debt = ledger ? ledger.outstandingBalance : 0;
      setCustomerDebt(debt);
      setAmount(debt);
      setNotes('Debt balance clearance');
    } else {
      setSelectedCustomerId(undefined);
      setCustomerName('');
      setAmount(0);
      setNotes('');
      setCustomerDebt(0);
    }
  };

  const handleCustomerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedCustomerId(undefined);
      setCustomerName('');
      setCustomerDebt(0);
      return;
    }
    const custId = parseInt(val, 10);
    const cust = customers.find(c => c.id === custId);
    if (cust && cust.id) {
      setSelectedCustomerId(cust.id);
      setCustomerName(cust.name);
      const ledger = await customerService.getCustomerLedger(cust.id);
      const debt = ledger ? ledger.outstandingBalance : 0;
      setCustomerDebt(debt);
      if (debt > 0) {
        setAmount(debt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (amount <= 0) {
      alert('Payment amount must be greater than 0.');
      return;
    }

    if (!customerName.trim()) {
      alert('Please select or specify customer name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = await paymentService.recordPayment({
        customerId: selectedCustomerId,
        customerName: customerName.trim(),
        saleId: targetSale?.id,
        amount,
        paymentMethod,
        notes
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });

      onPaymentRecorded(payment);
      onClose();
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Customer Payment"
      subtitle="Accept debt clearance or installment payments into digital cashbook"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Customer
          </label>
          {targetSale ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-semibold text-slate-900">{targetSale.customerName}</div>
              <div className="text-xs text-slate-500">Invoice: {targetSale.id} (Balance: {formatCurrency(targetSale.balance, currency)})</div>
            </div>
          ) : (
            <select
              id="payment-customer-select"
              value={selectedCustomerId || ''}
              onChange={handleCustomerChange}
              required
              className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No phone'})
                </option>
              ))}
            </select>
          )}

          {customerDebt > 0 && (
            <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-medium">Outstanding Debt:</span>
              <span className="font-bold text-amber-900">{formatCurrency(customerDebt, currency)}</span>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Amount ({currency})
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="100"
              required
              value={amount || ''}
              onChange={e => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="0"
              className="w-full text-xl font-bold bg-white border-2 border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {customerDebt > 0 && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(customerDebt)}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100"
              >
                Pay Full Debt ({formatCurrency(customerDebt, currency)})
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round(customerDebt / 2))}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-md hover:bg-slate-200"
              >
                Pay Half ({formatCurrency(Math.round(customerDebt / 2), currency)})
              </button>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Cash', 'Mobile Money', 'Bank', 'Other'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === m
                    ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {m === 'Cash' && <Banknote className="w-4 h-4 text-emerald-500" />}
                {m === 'Mobile Money' && <Smartphone className="w-4 h-4 text-amber-500" />}
                {m === 'Bank' && <Building2 className="w-4 h-4 text-sky-500" />}
                {m === 'Other' && <CreditCard className="w-4 h-4 text-slate-500" />}
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes / Reference (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. MTN MoMo Ref: 19827392"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full text-xs rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="submit-payment-button"
            type="submit"
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : <><Check className="w-4 h-4" /> Save Payment</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};
