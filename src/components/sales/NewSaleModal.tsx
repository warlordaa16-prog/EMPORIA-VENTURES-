import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus, Calculator, CreditCard, Banknote, Smartphone, Building2, Check, ArrowRight } from 'lucide-react';
import { Customer, PaymentMethod, Product, Sale } from '../../types';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { salesService } from '../../services/salesService';
import { calculateBalance, calculateSubtotal, calculateTotal, determinePaymentStatus } from '../../utils/calculations';
import { formatCurrency } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import confetti from 'canvas-confetti';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: (sale: Sale) => void;
  currency: string;
  preselectedCustomerId?: number;
}

interface LineItem {
  id: string;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleCreated,
  currency,
  preselectedCustomerId
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(preselectedCustomerId);
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState<boolean>(false);
  const [newCustAddress, setNewCustAddress] = useState<string>('');

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load customers and products on open
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, preselectedCustomerId]);

  const loadData = async () => {
    const [custList, prodList] = await Promise.all([
      customerService.getAll(),
      productService.getAll()
    ]);
    setCustomers(custList);
    setProducts(prodList);

    if (preselectedCustomerId) {
      const match = custList.find(c => c.id === preselectedCustomerId);
      if (match) {
        setSelectedCustomerId(match.id);
        setCustomerName(match.name);
        setCustomerPhone(match.phone);
        setIsNewCustomerMode(false);
      }
    } else {
      setSelectedCustomerId(undefined);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setIsNewCustomerMode(false);
    }

    // Default 1 line item
    setItems([{ id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }]);
    setDiscount(0);
    setAmountPaid(0);
    setPaymentMethod('Cash');
    setNotes('');
  };

  // Item modifications
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productIdStr: string) => {
    if (!productIdStr) {
      const updated = [...items];
      updated[index] = { ...updated[index], productId: undefined, description: '', unitPrice: 0 };
      setItems(updated);
      return;
    }

    const prodId = parseInt(productIdStr, 10);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        description: prod.name,
        unitPrice: prod.defaultPrice
      };
      setItems(updated);
    }
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce(
    (sum, it) => sum + calculateSubtotal(it.quantity, it.unitPrice),
    0
  );
  const total = calculateTotal(subtotal, discount);
  const balance = calculateBalance(total, amountPaid);
  const status = determinePaymentStatus(total, amountPaid);

  // Sync default full payment if amountPaid was equal to previous total or 0
  const handleQuickPayFull = () => {
    setAmountPaid(total);
  };

  const handleQuickPayZero = () => {
    setAmountPaid(0);
  };

  const handleQuickPayHalf = () => {
    setAmountPaid(Math.round(total / 2));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'walk-in') {
      setSelectedCustomerId(undefined);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setIsNewCustomerMode(false);
    } else if (val === 'new') {
      setSelectedCustomerId(undefined);
      setCustomerName('');
      setCustomerPhone('');
      setIsNewCustomerMode(true);
    } else {
      const custId = parseInt(val, 10);
      const cust = customers.find(c => c.id === custId);
      if (cust) {
        setSelectedCustomerId(cust.id);
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        setIsNewCustomerMode(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const validItems = items.filter(it => it.description.trim() !== '' && it.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item with description and price to complete the sale.');
      return;
    }

    if (total <= 0) {
      alert('Sale total must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalCustId = selectedCustomerId;
      let finalCustName = customerName.trim();
      let finalCustPhone = customerPhone.trim();

      // If new customer created inline
      if (isNewCustomerMode && finalCustName) {
        const created = await customerService.create({
          name: finalCustName,
          phone: finalCustPhone,
          address: newCustAddress.trim(),
          notes: 'Added during sale checkout'
        });
        finalCustId = created.id;
        finalCustName = created.name;
        finalCustPhone = created.phone;
      }

      const sale = await salesService.createSale({
        customerId: finalCustId,
        customerName: finalCustName || 'Walk-in Customer',
        customerPhone: finalCustPhone,
        discount,
        amountPaid,
        paymentMethod,
        notes,
        items: validItems.map(it => ({
          productId: it.productId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        }))
      });

      if (status === 'PAID') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      onSaleCreated(sale);
      onClose();
    } catch (err: any) {
      alert('Error creating sale: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Sale"
      subtitle="Fast transaction entry with automatic balance & status calculation"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer Information
            </label>
            {!isNewCustomerMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomerMode(true);
                  setSelectedCustomerId(undefined);
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="text-xs font-semibold text-sky-800 hover:text-sky-950 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> + New Customer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomerMode(false);
                  setSelectedCustomerId(undefined);
                  setCustomerName('Walk-in Customer');
                  setCustomerPhone('');
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Cancel / Pick Existing
              </button>
            )}
          </div>

          {!isNewCustomerMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  id="sale-customer-select"
                  value={selectedCustomerId || (customerName === 'Walk-in Customer' ? 'walk-in' : 'new')}
                  onChange={handleCustomerSelect}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                >
                  <option value="walk-in">Walk-in Customer (Cash & Carry)</option>
                  <optgroup label="Registered Customers">
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone || 'No phone'})
                      </option>
                    ))}
                  </optgroup>
                  <option value="new">+ Add New Customer...</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional customer phone"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Mukasa"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0772123456"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 4"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sale Items / Products
            </label>
            <span className="text-xs text-slate-500">
              {items.length} {items.length === 1 ? 'line item' : 'line items'}
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item, index) => {
              const lineSubtotal = calculateSubtotal(item.quantity, item.unitPrice);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 items-center text-sm"
                >
                  {/* Product or Custom Description */}
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    {products.length > 0 && (
                      <select
                        value={item.productId || ''}
                        onChange={e => handleProductSelect(index, e.target.value)}
                        className="w-full text-xs rounded-md border-slate-300 bg-white px-2 py-1 text-slate-700 shadow-2xs mb-1"
                      >
                        <option value="">-- Quick select product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.defaultPrice, currency)} / {p.unit})
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      required
                      placeholder="Item description / name"
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value)}
                      className="w-full text-xs rounded-md border-slate-300 bg-white px-2.5 py-1.5 text-slate-800 shadow-2xs focus:border-sky-700 focus:ring-1 focus:ring-sky-700 font-medium"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-slate-600 sm:hidden">Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={item.quantity || ''}
                      onChange={e =>
                        handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full text-xs rounded-md border-slate-300 bg-white px-2 py-1.5 text-slate-800 text-center font-medium shadow-2xs"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-slate-600 sm:hidden">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={item.unitPrice || ''}
                      onChange={e =>
                        handleItemChange(index, 'unitPrice', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      placeholder="Price"
                      className="w-full text-xs rounded-md border-slate-300 bg-white px-2 py-1.5 text-slate-800 font-medium shadow-2xs"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      {formatCurrency(lineSubtotal, currency)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-sky-800 hover:bg-sky-50 hover:border-sky-400 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Another Item
          </button>
        </div>

        {/* Calculation & Payment Panel */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl space-y-4">
          {/* Subtotal & Discount row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-slate-800 text-sm">
            <div className="flex items-center justify-between sm:justify-start sm:gap-4">
              <span className="text-xs text-slate-400">Subtotal:</span>
              <span className="text-sm font-semibold">{formatCurrency(subtotal, currency)}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Discount ({currency}):</span>
              <input
                type="number"
                min="0"
                step="100"
                value={discount || ''}
                onChange={e => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="0"
                className="w-28 text-xs bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-white text-right font-medium focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* TOTAL */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sale</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(total, currency)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-1">Status Preview</span>
              <StatusBadge status={status} size="lg" />
            </div>
          </div>

          {/* Amount Paid input + Quick presets */}
          <div className="bg-slate-800/90 p-3.5 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-400" /> Amount Paid Now:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleQuickPayFull}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors"
                >
                  Full Paid
                </button>
                <button
                  type="button"
                  onClick={handleQuickPayHalf}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-amber-700 hover:bg-amber-600 text-white rounded-md transition-colors"
                >
                  Half
                </button>
                <button
                  type="button"
                  onClick={handleQuickPayZero}
                  className="px-2 py-0.5 text-[11px] font-semibold bg-rose-800 hover:bg-rose-700 text-white rounded-md transition-colors"
                >
                  0 / Credit
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={total}
                  step="100"
                  value={amountPaid || ''}
                  onChange={e => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    setAmountPaid(Math.min(total, val));
                  }}
                  placeholder="0"
                  className="w-full text-lg font-bold bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Remaining Balance result */}
              <div className="flex items-center justify-between sm:justify-end gap-3 px-2 py-1 bg-slate-900/60 rounded-lg border border-slate-700/50">
                <span className="text-xs text-slate-400">Remaining Balance:</span>
                <span className={`text-base font-extrabold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatCurrency(balance, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['Cash', 'Mobile Money', 'Bank', 'Other'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center justify-center gap-1.5 ${
                      paymentMethod === method
                        ? 'bg-sky-600 text-white border-sky-500 shadow-xs'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {method === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                    {method === 'Mobile Money' && <Smartphone className="w-3.5 h-3.5 text-amber-400" />}
                    {method === 'Bank' && <Building2 className="w-3.5 h-3.5 text-sky-400" />}
                    {method === 'Other' && <CreditCard className="w-3.5 h-3.5 text-slate-400" />}
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Remarks (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Sent via boda, promised Friday"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            id="submit-sale-button"
            type="submit"
            disabled={isSubmitting || total <= 0}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#173B6C] hover:bg-[#2F6DB2] active:scale-[0.99] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Sale & Generate Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
