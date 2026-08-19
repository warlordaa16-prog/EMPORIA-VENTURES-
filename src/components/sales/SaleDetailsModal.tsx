import React, { useState } from 'react';
import { Printer, Share2, Trash2, CheckCircle2, MessageSquare, PlusCircle, ArrowLeft } from 'lucide-react';
import { PaymentMethod, Sale, ShopSettings } from '../../types';
import { paymentService } from '../../services/paymentService';
import { salesService } from '../../services/salesService';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/dates';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';

interface SaleDetailsModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSaleUpdated: () => void;
  onRecordPaymentClick?: (sale: Sale) => void;
}

export const SaleDetailsModal: React.FC<SaleDetailsModalProps> = ({
  sale,
  isOpen,
  onClose,
  settings,
  onSaleUpdated,
  onRecordPaymentClick
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsAppText = () => {
    const lines = [
      `*🧾 ${settings.shopName}*`,
      `📍 ${settings.address}`,
      `📞 ${settings.phone}`,
      `---------------------------------`,
      `*Receipt ID:* ${sale.id}`,
      `*Date:* ${formatDateTime(sale.saleDate)}`,
      `*Customer:* ${sale.customerName}`,
      sale.customerPhone ? `*Phone:* ${sale.customerPhone}` : '',
      `---------------------------------`,
      `*ITEMS:*`,
      ...(sale.items || []).map(
        it => `• ${it.description} x${it.quantity} @ ${formatCurrency(it.unitPrice, settings.currency)} = *${formatCurrency(it.subtotal, settings.currency)}*`
      ),
      `---------------------------------`,
      sale.discount > 0 ? `Subtotal: ${formatCurrency(sale.subtotal, settings.currency)}` : '',
      sale.discount > 0 ? `Discount: -${formatCurrency(sale.discount, settings.currency)}` : '',
      `*TOTAL:* ${formatCurrency(sale.total, settings.currency)}`,
      `*Amount Paid:* ${formatCurrency(sale.amountPaid, settings.currency)} (${sale.paymentMethod})`,
      `*Remaining Balance:* ${formatCurrency(sale.balance, settings.currency)}`,
      `*Status:* ${sale.status}`,
      `---------------------------------`,
      `${settings.receiptFooter || 'Thank you for your business!'}`
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete sale ${sale.id}? This will also remove associated payments.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await salesService.deleteSale(sale.id);
      onSaleUpdated();
      onClose();
    } catch (err: any) {
      alert('Failed to delete sale: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sale Receipt — ${sale.id}`}
      subtitle={`Created on ${formatDateTime(sale.createdAt)} by ${sale.createdBy}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Actions header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <StatusBadge status={sale.status} size="md" />
            <span className="text-xs text-slate-500 font-medium">{sale.paymentMethod}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-whatsapp-receipt-button"
              type="button"
              onClick={handleCopyWhatsAppText}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1.5"
              title="Copy receipt as formatted text for WhatsApp / SMS"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedNotification ? 'Copied!' : 'Share / Copy'}
            </button>

            <button
              id="print-receipt-button"
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>

            {settings.activeRole === 'owner' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete Sale Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          id="printable-receipt"
          className="bg-white p-5 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 space-y-4 shadow-xs"
        >
          {/* Shop branding header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
            <h3 className="font-bold text-sm tracking-tight text-slate-900 uppercase font-sans">
              {settings.shopName}
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">{settings.address}</p>
            <p className="text-[11px] text-slate-500 font-sans">Tel: {settings.phone}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-dashed border-slate-300">
            <div>
              <span className="text-slate-500 block">Transaction ID:</span>
              <span className="font-bold">{sale.id}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Date & Time:</span>
              <span>{formatDateTime(sale.saleDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Customer:</span>
              <span className="font-semibold">{sale.customerName}</span>
              {sale.customerPhone && <span className="block text-slate-500">{sale.customerPhone}</span>}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Cashier / Staff:</span>
              <span>{sale.createdBy}</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold text-slate-600 text-[11px] pb-1 border-b border-slate-200">
              <span>Item / Qty</span>
              <span>Amount</span>
            </div>

            {(sale.items || []).map((it, idx) => (
              <div key={idx} className="flex justify-between text-[11px] py-0.5">
                <div>
                  <span className="font-semibold">{it.description}</span>
                  <span className="text-slate-500 ml-1.5">
                    ({it.quantity} x {formatCurrency(it.unitPrice, settings.currency)})
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(it.subtotal, settings.currency)}</span>
              </div>
            ))}
          </div>

          {/* Total calculations */}
          <div className="space-y-1 pt-2 border-t border-dashed border-slate-300 text-[12px]">
            {sale.discount > 0 && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale.subtotal, settings.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatCurrency(sale.discount, settings.currency)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-300">
              <span>TOTAL SALE:</span>
              <span>{formatCurrency(sale.total, settings.currency)}</span>
            </div>

            <div className="flex justify-between text-slate-700">
              <span>Amount Paid:</span>
              <span className="font-semibold">{formatCurrency(sale.amountPaid, settings.currency)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900">
              <span>Remaining Balance:</span>
              <span className={sale.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                {formatCurrency(sale.balance, settings.currency)}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[11px] text-slate-500 font-sans">
            <p>{settings.receiptFooter || 'Thank you for your business!'}</p>
            <p className="text-[9px] text-slate-400 mt-1">Powered by ShopPay Offline Cashbook</p>
          </div>
        </div>

        {/* If balance is outstanding, provide direct Record Payment action */}
        {sale.balance > 0 && onRecordPaymentClick && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-amber-900">Outstanding Balance: {formatCurrency(sale.balance, settings.currency)}</h4>
              <p className="text-[11px] text-amber-700">Customer still owes money on this invoice.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRecordPaymentClick(sale);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Pay Balance
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
