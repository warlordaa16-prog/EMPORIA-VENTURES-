import { db } from '../db/database';
import { Customer, CustomerSummary } from '../types';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    return await db.customers.toArray();
  },

  async getById(id: number): Promise<Customer | undefined> {
    return await db.customers.get(id);
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      createdAt: now,
      updatedAt: now
    };
    const id = await db.customers.add(newCustomer);
    return { ...newCustomer, id: id as number };
  },

  async update(id: number, customer: Partial<Customer>): Promise<Customer> {
    const existing = await db.customers.get(id);
    if (!existing) throw new Error('Customer not found');
    const updated: Customer = {
      ...existing,
      ...customer,
      updatedAt: new Date().toISOString()
    };
    await db.customers.put(updated);
    return updated;
  },

  async delete(id: number): Promise<void> {
    await db.customers.delete(id);
  },

  async getSummaries(): Promise<CustomerSummary[]> {
    const customers = await db.customers.toArray();
    const sales = await db.sales.toArray();
    const payments = await db.payments.toArray();

    return customers.map(cust => {
      const custSales = sales.filter(s => s.customerId === cust.id);
      const custPayments = payments.filter(p => p.customerId === cust.id);

      const totalPurchases = custSales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = Math.max(0, totalPurchases - totalPaid);

      // Find last activity
      const allDates = [
        ...custSales.map(s => s.saleDate),
        ...custPayments.map(p => p.paymentDate)
      ].sort().reverse();

      return {
        ...cust,
        totalPurchases,
        totalPaid,
        outstandingBalance,
        salesCount: custSales.length,
        paymentsCount: custPayments.length,
        lastActivityDate: allDates[0] || cust.createdAt
      };
    });
  },

  async getCustomerLedger(customerId: number) {
    const customer = await db.customers.get(customerId);
    if (!customer) return null;

    const sales = await db.sales.where('customerId').equals(customerId).reverse().sortBy('saleDate');
    const payments = await db.payments.where('customerId').equals(customerId).reverse().sortBy('paymentDate');

    const totalPurchases = sales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = Math.max(0, totalPurchases - totalPaid);

    return {
      customer,
      sales,
      payments,
      totalPurchases,
      totalPaid,
      outstandingBalance
    };
  }
};
