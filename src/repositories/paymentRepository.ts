import { db } from '../db/database';
import { Payment } from '../types';

export const paymentRepository = {
  async getAll(): Promise<Payment[]> {
    return await db.payments.orderBy('paymentDate').reverse().toArray();
  },

  async getById(id: string): Promise<Payment | undefined> {
    return await db.payments.get(id);
  },

  async getByCustomerId(customerId: number): Promise<Payment[]> {
    return await db.payments.where('customerId').equals(customerId).toArray();
  },

  async getBySaleId(saleId: string): Promise<Payment[]> {
    return await db.payments.where('saleId').equals(saleId).toArray();
  },

  async create(payment: Payment): Promise<string> {
    await db.payments.add(payment);
    return payment.id;
  },

  async delete(id: string): Promise<void> {
    await db.payments.delete(id);
  },

  async count(): Promise<number> {
    return await db.payments.count();
  },

  async clear(): Promise<void> {
    await db.payments.clear();
  }
};
