import { PaymentStatus } from '../types';

export function calculateSubtotal(quantity: number, unitPrice: number): number {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  return Math.max(0, Math.round(qty * price));
}

export function calculateTotal(subtotal: number, discount: number = 0): number {
  const sub = Number(subtotal) || 0;
  const disc = Number(discount) || 0;
  return Math.max(0, Math.round(sub - disc));
}

export function calculateBalance(total: number, amountPaid: number = 0): number {
  const tot = Number(total) || 0;
  const paid = Number(amountPaid) || 0;
  return Math.max(0, Math.round(tot - paid));
}

export function determinePaymentStatus(total: number, amountPaid: number): PaymentStatus {
  const tot = Number(total) || 0;
  const paid = Number(amountPaid) || 0;

  if (tot <= 0) return 'PAID';
  if (paid >= tot) return 'PAID';
  if (paid > 0 && paid < tot) return 'PARTIAL';
  return 'CREDIT';
}
