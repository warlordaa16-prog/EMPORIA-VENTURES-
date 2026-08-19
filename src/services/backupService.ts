import { db, initializeDatabase } from '../db/database';
import { BackupData, Customer, Payment, Product, Sale, SaleItem } from '../types';
import { downloadCSV, downloadJSON } from '../utils/export';
import { settingsService } from './settingsService';

export const backupService = {
  async exportFullBackup(): Promise<BackupData> {
    const settings = await settingsService.getSettings();
    const customers = await db.customers.toArray();
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const saleItems = await db.sale_items.toArray();
    const payments = await db.payments.toArray();

    const dateStr = new Date().toISOString().split('T')[0];
    const backup: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      customers,
      products,
      sales,
      saleItems,
      payments
    };

    downloadJSON(backup, `shoppay-backup-${dateStr}.json`);
    return backup;
  },

  async restoreFromJSON(jsonData: BackupData): Promise<boolean> {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid backup file format');
    }

    await db.transaction('rw', [db.customers, db.products, db.sales, db.sale_items, db.payments, db.settings], async () => {
      await db.customers.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
      await db.settings.clear();

      if (jsonData.settings) {
        await db.settings.add(jsonData.settings);
      }
      if (Array.isArray(jsonData.customers) && jsonData.customers.length > 0) {
        await db.customers.bulkAdd(jsonData.customers);
      }
      if (Array.isArray(jsonData.products) && jsonData.products.length > 0) {
        await db.products.bulkAdd(jsonData.products);
      }
      if (Array.isArray(jsonData.sales) && jsonData.sales.length > 0) {
        await db.sales.bulkAdd(jsonData.sales);
      }
      if (Array.isArray(jsonData.saleItems) && jsonData.saleItems.length > 0) {
        await db.sale_items.bulkAdd(jsonData.saleItems);
      }
      if (Array.isArray(jsonData.payments) && jsonData.payments.length > 0) {
        await db.payments.bulkAdd(jsonData.payments);
      }
    });

    return true;
  },

  async exportSalesCSV() {
    const sales = await db.sales.reverse().sortBy('saleDate');
    const headers = ['Sale ID', 'Date', 'Customer Name', 'Phone', 'Subtotal', 'Discount', 'Total', 'Amount Paid', 'Balance', 'Status', 'Payment Method', 'Notes', 'Recorded By'];
    const rows = sales.map(s => [
      s.id,
      s.saleDate,
      s.customerName,
      s.customerPhone || '',
      s.subtotal,
      s.discount,
      s.total,
      s.amountPaid,
      s.balance,
      s.status,
      s.paymentMethod,
      s.notes || '',
      s.createdBy
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(headers, rows, `shoppay-sales-${dateStr}.csv`);
  },

  async exportPaymentsCSV() {
    const payments = await db.payments.reverse().sortBy('paymentDate');
    const headers = ['Payment ID', 'Date', 'Customer Name', 'Sale ID', 'Amount', 'Payment Method', 'Notes', 'Recorded By'];
    const rows = payments.map(p => [
      p.id,
      p.paymentDate,
      p.customerName,
      p.saleId || 'General Account',
      p.amount,
      p.paymentMethod,
      p.notes || '',
      p.createdBy
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(headers, rows, `shoppay-payments-${dateStr}.csv`);
  },

  async exportCustomersCSV() {
    const customers = await db.customers.toArray();
    const sales = await db.sales.toArray();
    const payments = await db.payments.toArray();

    const headers = ['ID', 'Name', 'Phone', 'Address', 'Total Purchases', 'Total Paid', 'Outstanding Debt', 'Notes'];
    const rows = customers.map(c => {
      const custSales = sales.filter(s => s.customerId === c.id);
      const custPayments = payments.filter(p => p.customerId === c.id);
      const totalPurchases = custSales.reduce((sum, s) => sum + s.total, 0);
      const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, totalPurchases - totalPaid);

      return [
        c.id || '',
        c.name,
        c.phone,
        c.address || '',
        totalPurchases,
        totalPaid,
        balance,
        c.notes || ''
      ];
    });

    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(headers, rows, `shoppay-customers-${dateStr}.csv`);
  },

  async resetToDemoData() {
    await db.transaction('rw', [db.customers, db.products, db.sales, db.sale_items, db.payments, db.settings], async () => {
      await db.customers.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
      await db.settings.clear();
    });
    await initializeDatabase();
  },

  async clearAllData() {
    await db.transaction('rw', [db.customers, db.products, db.sales, db.sale_items, db.payments, db.settings], async () => {
      await db.customers.clear();
      await db.products.clear();
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
    });
  }
};
