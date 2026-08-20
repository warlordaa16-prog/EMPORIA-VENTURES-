import { salesRepository } from '../repositories/salesRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { customerRepository } from '../repositories/customerRepository';
import { productRepository } from '../repositories/productRepository';
import { ProfitProductStats, ReportStats } from '../types';
import { isDateWithinFilter } from '../utils/dates';

export const reportService = {
  async getStatsForPeriod(
    period: 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom',
    customStart?: string,
    customEnd?: string
  ): Promise<ReportStats> {
    const allSales = await salesRepository.getAll();
    const allPayments = await paymentRepository.getAll();
    const allItems = await salesRepository.getAllSaleItems();
    const allProducts = await productRepository.getAll();

    // Map of product id/name to costPrice
    const productCostMap = new Map<number, number>();
    const productNameCostMap = new Map<string, number>();
    for (const p of allProducts) {
      if (p.id) productCostMap.set(p.id, p.costPrice ?? Math.round(p.defaultPrice * 0.75));
      productNameCostMap.set(p.name.toLowerCase(), p.costPrice ?? Math.round(p.defaultPrice * 0.75));
    }

    const filteredSales = allSales.filter(s =>
      isDateWithinFilter(s.saleDate, period, customStart, customEnd)
    );
    const filteredSaleIds = new Set(filteredSales.map(s => s.id));

    const filteredPayments = allPayments.filter(p =>
      isDateWithinFilter(p.paymentDate, period, customStart, customEnd)
    );

    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const paymentsReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate Cost of Goods Sold (COGS) for items in filtered sales
    const filteredItems = allItems.filter(it => it.saleId && filteredSaleIds.has(it.saleId));
    let totalCost = 0;
    for (const item of filteredItems) {
      const unitCost = item.costPrice 
        ?? (item.productId ? productCostMap.get(item.productId) : undefined)
        ?? productNameCostMap.get(item.description.toLowerCase())
        ?? Math.round(item.unitPrice * 0.75);
      totalCost += (unitCost * item.quantity);
    }

    // If there were sales without detailed items, estimate cost based on 75% baseline
    if (totalSales > 0 && totalCost === 0 && filteredItems.length === 0) {
      totalCost = Math.round(totalSales * 0.75);
    }

    const grossProfit = Math.max(0, totalSales - totalCost);
    const profitMargin = totalSales > 0 ? Number(((grossProfit / totalSales) * 100).toFixed(1)) : 0;

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
      totalCost,
      grossProfit,
      profitMargin,
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

  async getProfitBreakdownByProducts(
    period: 'today' | 'yesterday' | 'week' | 'month' | 'all' = 'today',
    limit: number = 6
  ): Promise<ProfitProductStats[]> {
    const allSales = await salesRepository.getAll();
    const allItems = await salesRepository.getAllSaleItems();
    const allProducts = await productRepository.getAll();

    const productCostMap = new Map<number, number>();
    const productNameCostMap = new Map<string, number>();
    for (const p of allProducts) {
      if (p.id) productCostMap.set(p.id, p.costPrice ?? Math.round(p.defaultPrice * 0.75));
      productNameCostMap.set(p.name.toLowerCase(), p.costPrice ?? Math.round(p.defaultPrice * 0.75));
    }

    const filteredSales = allSales.filter(s => isDateWithinFilter(s.saleDate, period));
    const filteredSaleIds = new Set(filteredSales.map(s => s.id));
    const filteredItems = allItems.filter(it => it.saleId && filteredSaleIds.has(it.saleId));

    const map = new Map<string, { description: string; quantity: number; revenue: number; cost: number }>();

    for (const it of filteredItems) {
      const unitCost = it.costPrice 
        ?? (it.productId ? productCostMap.get(it.productId) : undefined)
        ?? productNameCostMap.get(it.description.toLowerCase())
        ?? Math.round(it.unitPrice * 0.75);

      const existing = map.get(it.description) || {
        description: it.description,
        quantity: 0,
        revenue: 0,
        cost: 0
      };
      existing.quantity += it.quantity;
      existing.revenue += it.subtotal;
      existing.cost += (unitCost * it.quantity);
      map.set(it.description, existing);
    }

    return Array.from(map.values())
      .map(item => {
        const profit = Math.max(0, item.revenue - item.cost);
        const margin = item.revenue > 0 ? Number(((profit / item.revenue) * 100).toFixed(1)) : 0;
        return {
          description: item.description,
          quantity: item.quantity,
          revenue: item.revenue,
          cost: item.cost,
          profit,
          margin
        };
      })
      .sort((a, b) => b.profit - a.profit)
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
