import { salesRepository } from '../repositories/salesRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { customerRepository } from '../repositories/customerRepository';
import { ReportStats } from '../types';
import { isDateWithinFilter } from '../utils/dates';

export const reportService = {
  async getStatsForPeriod(
    period: 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom',
    customStart?: string,
    customEnd?: string
  ): Promise<ReportStats> {
    const allSales = await salesRepository.getAll();
    const allPayments = await paymentRepository.getAll();

    const filteredSales = allSales.filter(s =>
      isDateWithinFilter(s.saleDate, period, customStart, customEnd)
    );

    const filteredPayments = allPayments.filter(p =>
      isDateWithinFilter(p.paymentDate, period, customStart, customEnd)
    );

    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const paymentsReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // Outstanding credit in filtered period sales
    const outstandingCredit = filteredSales.reduce((sum, s) => sum + s.balance, 0);

    // Breakdown by payment methods received
    let cashReceived = 0;
    let mobileMoneyReceived = 0;
    let bankReceived = 0;
    let otherReceived = 0;

    for (const p of filteredPayments) {
      if (p.paymentMethod === 'Cash') cashReceived += p.amount;
      else if (p.paymentMethod === 'Mobile Money') mobileMoneyReceived += p.amount;
      else if (p.paymentMethod === 'Bank') bankReceived += p.amount;
      else otherReceived += p.amount;
    }

    let paidCount = 0;
    let partialCount = 0;
    let creditCount = 0;

    for (const s of filteredSales) {
      if (s.status === 'PAID') paidCount++;
      else if (s.status === 'PARTIAL') partialCount++;
      else creditCount++;
    }

    const labels: Record<string, string> = {
      today: "Today's Summary",
      yesterday: "Yesterday's Summary",
      week: 'This Week',
      month: 'This Month',
      all: 'All Time Records',
      custom: 'Custom Date Range'
    };

    return {
      periodLabel: labels[period] || period,
      totalSales,
      paymentsReceived,
      outstandingCredit,
      transactionCount: filteredSales.length,
      cashReceived,
      mobileMoneyReceived,
      bankReceived,
      otherReceived,
      paidCount,
      partialCount,
      creditCount
    };
  },

  async getTopSellingProducts(limit: number = 5) {
    const items = await salesRepository.getAllSaleItems();
    const map = new Map<string, { description: string; quantity: number; revenue: number }>();

    for (const it of items) {
      const existing = map.get(it.description) || {
        description: it.description,
        quantity: 0,
        revenue: 0
      };
      existing.quantity += it.quantity;
      existing.revenue += it.subtotal;
      map.set(it.description, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  async getTopDebtors(limit: number = 5) {
    const customers = await customerRepository.getAll();
    const sales = await salesRepository.getAll();
    const payments = await paymentRepository.getAll();

    const debtorList = customers.map(cust => {
      const custSales = sales.filter(s => s.customerId === cust.id);
      const custPayments = payments.filter(p => p.customerId === cust.id);
      const totalPurchases = custSales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, totalPurchases - totalPaid);

      return {
        customer: cust,
        totalPurchases,
        totalPaid,
        balance
      };
    })
    .filter(d => d.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);

    return debtorList;
  }
};
