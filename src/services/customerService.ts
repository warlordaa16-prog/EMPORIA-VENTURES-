import { customerRepository } from '../repositories/customerRepository';
import { salesRepository } from '../repositories/salesRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { Customer, CustomerSummary } from '../types';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    return await customerRepository.getAll();
  },

  async getById(id: number): Promise<Customer | undefined> {
    return await customerRepository.getById(id);
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Omit<Customer, 'id'> = {
      ...customer,
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      createdAt: now,
      updatedAt: now
    };
    const id = await customerRepository.create(newCustomer);
    return { ...newCustomer, id };
  },

  async update(id: number, customer: Partial<Customer>): Promise<Customer> {
    const existing = await customerRepository.getById(id);
    if (!existing) throw new Error('Customer not found');
    const updated: Customer = {
      ...existing,
      ...customer,
      updatedAt: new Date().toISOString()
    };
    await customerRepository.update(id, updated);
    return updated;
  },

  async delete(id: number): Promise<void> {
    await customerRepository.delete(id);
  },

  /**
   * Customer Credit Ledger summaries: Total Purchases, Total Paid, Outstanding Credit
   */
  async getSummaries(): Promise<CustomerSummary[]> {
    const customers = await customerRepository.getAll();
    const sales = await salesRepository.getAll();
    const payments = await paymentRepository.getAll();

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

  /**
   * Comprehensive Customer credit details with sales & payment histories
   */
  async getCustomerLedger(customerId: number) {
    const customer = await customerRepository.getById(customerId);
    if (!customer) return null;

    const allSales = await salesRepository.getByCustomerId(customerId);
    const sales = allSales.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());

    const allPayments = await paymentRepository.getByCustomerId(customerId);
    const payments = allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

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
