import { db } from '../db/database';
import { Payment, PaymentMethod } from '../types';
import { determinePaymentStatus } from '../utils/calculations';

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    return await db.payments.reverse().sortBy('paymentDate');
  },

  async generatePaymentId(): Promise<string> {
    const count = await db.payments.count();
    const all = await db.payments.toArray();
    let maxNum = count;

    for (const p of all) {
      if (p.id.startsWith('PM-')) {
        const num = parseInt(p.id.replace('PM-', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `PM-${String(nextNum).padStart(6, '0')}`;
  },

  async recordPayment(data: {
    customerId?: number;
    customerName: string;
    saleId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
    createdBy?: string;
  }): Promise<Payment> {
    const paymentId = await this.generatePaymentId();
    const now = data.paymentDate || new Date().toISOString();
    const amount = Math.max(0, Number(data.amount) || 0);

    const payment: Payment = {
      id: paymentId,
      customerId: data.customerId,
      customerName: data.customerName.trim() || 'Customer',
      saleId: data.saleId,
      amount,
      paymentMethod: data.paymentMethod,
      paymentDate: now,
      notes: data.notes?.trim() || '',
      createdBy: data.createdBy || 'Staff',
      createdAt: now
    };

    await db.transaction('rw', [db.payments, db.sales], async () => {
      await db.payments.add(payment);

      // If tied to a specific sale:
      if (data.saleId) {
        const sale = await db.sales.get(data.saleId);
        if (sale) {
          const newPaid = Math.min(sale.total, sale.amountPaid + amount);
          const newBalance = Math.max(0, sale.total - newPaid);
          const newStatus = determinePaymentStatus(sale.total, newPaid);

          await db.sales.update(data.saleId, {
            amountPaid: newPaid,
            balance: newBalance,
            status: newStatus,
            updatedAt: now
          });
        }
      } else if (data.customerId) {
        // Customer debt reduction: allocate across unpaid sales in chronological order
        let remainingAmountToApply = amount;
        const unpaidSales = await db.sales
          .where('customerId')
          .equals(data.customerId)
          .filter(s => s.balance > 0)
          .sortBy('saleDate');

        for (const s of unpaidSales) {
          if (remainingAmountToApply <= 0) break;
          const allocation = Math.min(remainingAmountToApply, s.balance);
          const newPaid = s.amountPaid + allocation;
          const newBalance = s.total - newPaid;
          const newStatus = determinePaymentStatus(s.total, newPaid);

          await db.sales.update(s.id, {
            amountPaid: newPaid,
            balance: newBalance,
            status: newStatus,
            updatedAt: now
          });

          remainingAmountToApply -= allocation;
        }
      }
    });

    return payment;
  },

  async deletePayment(id: string): Promise<void> {
    await db.payments.delete(id);
  }
};
