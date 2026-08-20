import { paymentRepository } from '../repositories/paymentRepository';
import { salesRepository } from '../repositories/salesRepository';
import { Payment, PaymentMethod } from '../types';
import { determinePaymentStatus } from '../utils/calculations';

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    return await paymentRepository.getAll();
  },

  async generatePaymentId(): Promise<string> {
    const all = await paymentRepository.getAll();
    let maxNum = all.length;

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

    await paymentRepository.create(payment);

    // If linked to a specific sale:
    if (data.saleId) {
      const sale = await salesRepository.getById(data.saleId);
      if (sale) {
        const newPaid = Math.min(sale.total, sale.amountPaid + amount);
        const newBalance = Math.max(0, sale.total - newPaid);
        const newStatus = determinePaymentStatus(sale.total, newPaid);

        await salesRepository.update(data.saleId, {
          amountPaid: newPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: now
        });
      }
    } else if (data.customerId) {
      // Customer debt reduction: allocate across unpaid sales in chronological order
      let remainingAmountToApply = amount;
      const allSales = await salesRepository.getByCustomerId(data.customerId);
      const unpaidSales = allSales
        .filter(s => s.balance > 0)
        .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());

      for (const s of unpaidSales) {
        if (remainingAmountToApply <= 0) break;
        const allocation = Math.min(remainingAmountToApply, s.balance);
        const newPaid = s.amountPaid + allocation;
        const newBalance = s.total - newPaid;
        const newStatus = determinePaymentStatus(s.total, newPaid);

        await salesRepository.update(s.id, {
          amountPaid: newPaid,
          balance: newBalance,
          status: newStatus,
          updatedAt: now
        });

        remainingAmountToApply -= allocation;
      }
    }

    return payment;
  },

  async deletePayment(id: string): Promise<void> {
    await paymentRepository.delete(id);
  }
};
