import { backupRepository } from '../repositories/backupRepository';
import { salesRepository } from '../repositories/salesRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { customerRepository } from '../repositories/customerRepository';
import { initializeDatabase } from '../db/database';
import { BackupData } from '../types';
import { downloadCSV, downloadJSON } from '../utils/export';

export const backupService = {
  /**
   * Export all data as JSON to DEVICE
   */
  async exportFullBackup(): Promise<BackupData> {
    const backup = await backupRepository.dumpAllData();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSON(backup, `shoppay-backup-${dateStr}.json`);
    return backup;
  },

  /**
   * Restore all data from JSON backup file uploaded from DEVICE
   */
  async restoreFromJSON(jsonData: BackupData): Promise<boolean> {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid backup file format');
    }
    await backupRepository.restoreAllData(jsonData);
    return true;
  },

  async exportSalesCSV() {
    const sales = await salesRepository.getAll();
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
    const payments = await paymentRepository.getAll();
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
    const customers = await customerRepository.getAll();
    const sales = await salesRepository.getAll();
    const payments = await paymentRepository.getAll();

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
    await backupRepository.wipeDatabase();
    await initializeDatabase();
  },

  async clearAllData() {
    await backupRepository.wipeDatabase();
  }
};
