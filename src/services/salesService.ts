import { db } from '../db/database';
import { Payment, PaymentMethod, Sale, SaleItem } from '../types';
import { calculateBalance, calculateSubtotal, calculateTotal, determinePaymentStatus } from '../utils/calculations';

export const salesService = {
  async getAll(): Promise<Sale[]> {
    const sales = await db.sales.reverse().sortBy('saleDate');
    return sales;
  },

  async getById(id: string): Promise<Sale | undefined> {
    const sale = await db.sales.get(id);
    if (sale) {
      const items = await db.sale_items.where('saleId').equals(id).toArray();
      sale.items = items;
    }
    return sale;
  },

  async generateSaleId(): Promise<string> {
    const count = await db.sales.count();
    const allSales = await db.sales.toArray();
    let maxNum = count;

    // Scan existing IDs like SP-000045
    for (const s of allSales) {
      if (s.id.startsWith('SP-')) {
        const num = parseInt(s.id.replace('SP-', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `SP-${String(nextNum).padStart(6, '0')}`;
  },

  async createSale(data: {
    customerId?: number;
    customerName: string;
    customerPhone?: string;
    saleDate?: string;
    discount?: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    createdBy?: string;
    items: Array<{
      productId?: number;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<Sale> {
    const saleId = await this.generateSaleId();
    const now = data.saleDate || new Date().toISOString();

    // Calculate item subtotals
    const processedItems: SaleItem[] = data.items.map(it => {
      const sub = calculateSubtotal(it.quantity, it.unitPrice);
      return {
        saleId,
        productId: it.productId,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        subtotal: sub
      };
    });

    const subtotal = processedItems.reduce((sum, it) => sum + it.subtotal, 0);
    const discount = Number(data.discount) || 0;
    const total = calculateTotal(subtotal, discount);
    const amountPaid = Math.min(total, Math.max(0, Number(data.amountPaid) || 0));
    const balance = calculateBalance(total, amountPaid);
    const status = determinePaymentStatus(total, amountPaid);

    const sale: Sale = {
      id: saleId,
      customerId: data.customerId,
      customerName: data.customerName.trim() || 'Walk-in Customer',
      customerPhone: data.customerPhone?.trim() || '',
      saleDate: now,
      subtotal,
      discount,
      total,
      amountPaid,
      balance,
      status,
      paymentMethod: data.paymentMethod,
      notes: data.notes?.trim() || '',
      createdBy: data.createdBy || 'Staff',
      createdAt: now,
      updatedAt: now,
      items: processedItems
    };

    // Atomic write to DB
    await db.transaction('rw', [db.sales, db.sale_items, db.payments], async () => {
      await db.sales.add(sale);
      if (processedItems.length > 0) {
        await db.sale_items.bulkAdd(processedItems);
      }

      // If any amount was paid upon creation, record into the payment ledger
      if (amountPaid > 0) {
        const paymentCount = await db.payments.count();
        const paymentId = `PM-${String(paymentCount + 1).padStart(6, '0')}`;
        const payment: Payment = {
          id: paymentId,
          customerId: data.customerId,
          customerName: sale.customerName,
          saleId: saleId,
          amount: amountPaid,
          paymentMethod: data.paymentMethod,
          paymentDate: now,
          notes: `Initial payment for ${saleId}`,
          createdBy: data.createdBy || 'Staff',
          createdAt: now
        };
        await db.payments.add(payment);
      }
    });

    return sale;
  },

  async updateSale(id: string, updates: Partial<Sale>, items?: SaleItem[]): Promise<Sale> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Sale not found');

    const updatedSale: Sale = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (items) {
      const subtotal = items.reduce((sum, it) => sum + calculateSubtotal(it.quantity, it.unitPrice), 0);
      const discount = updatedSale.discount || 0;
      const total = calculateTotal(subtotal, discount);
      const amountPaid = Math.min(total, updatedSale.amountPaid || 0);
      const balance = calculateBalance(total, amountPaid);
      const status = determinePaymentStatus(total, amountPaid);

      updatedSale.subtotal = subtotal;
      updatedSale.total = total;
      updatedSale.amountPaid = amountPaid;
      updatedSale.balance = balance;
      updatedSale.status = status;
      updatedSale.items = items;
    }

    await db.transaction('rw', [db.sales, db.sale_items], async () => {
      await db.sales.put(updatedSale);
      if (items) {
        await db.sale_items.where('saleId').equals(id).delete();
        await db.sale_items.bulkAdd(items.map(it => ({ ...it, saleId: id })));
      }
    });

    return updatedSale;
  },

  async deleteSale(id: string): Promise<void> {
    await db.transaction('rw', [db.sales, db.sale_items, db.payments], async () => {
      await db.sales.delete(id);
      await db.sale_items.where('saleId').equals(id).delete();
      await db.payments.where('saleId').equals(id).delete();
    });
  }
};
