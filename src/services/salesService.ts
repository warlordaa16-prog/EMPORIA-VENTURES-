import { salesRepository } from '../repositories/salesRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { productRepository } from '../repositories/productRepository';
import { Payment, PaymentMethod, Sale, SaleItem } from '../types';
import { calculateBalance, calculateSubtotal, calculateTotal, determinePaymentStatus } from '../utils/calculations';

export const salesService = {
  async getAll(): Promise<Sale[]> {
    return await salesRepository.getAll();
  },

  async getById(id: string): Promise<Sale | undefined> {
    const sale = await salesRepository.getById(id);
    if (sale) {
      const items = await salesRepository.getItemsBySaleId(id);
      sale.items = items;
    }
    return sale;
  },

  async generateSaleId(): Promise<string> {
    const allSales = await salesRepository.getAll();
    let maxNum = allSales.length;

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
      costPrice?: number;
    }>;
  }): Promise<Sale> {
    const saleId = await this.generateSaleId();
    const now = data.saleDate || new Date().toISOString();

    // Fetch product map to determine unit costs accurately
    const allProducts = await productRepository.getAll();
    const productMap = new Map<number, number>();
    for (const p of allProducts) {
      if (p.id) productMap.set(p.id, p.costPrice ?? Math.round(p.defaultPrice * 0.75));
    }

    // Calculate item subtotals & attach cost price
    const processedItems: SaleItem[] = data.items.map(it => {
      const sub = calculateSubtotal(it.quantity, it.unitPrice);
      const unitCost = it.costPrice !== undefined 
        ? it.costPrice 
        : (it.productId ? productMap.get(it.productId) : Math.round(it.unitPrice * 0.75)) ?? Math.round(it.unitPrice * 0.75);

      return {
        saleId,
        productId: it.productId,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        costPrice: unitCost,
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

    // Save sale + items in repository
    await salesRepository.create(sale, processedItems);

    // Automatically update product stock quantities
    for (const item of processedItems) {
      if (item.productId) {
        try {
          const product = await productRepository.getById(item.productId);
          if (product && product.trackStock !== false && product.stockQuantity !== undefined) {
            const newStock = Math.max(0, product.stockQuantity - item.quantity);
            await productRepository.update(product.id!, { stockQuantity: newStock });
          }
        } catch (e) {
          console.warn('Failed to update product stock for item', item, e);
        }
      }
    }

    // If initial payment was made, record in payment repository
    if (amountPaid > 0) {
      const allPayments = await paymentRepository.getAll();
      const nextPayNum = allPayments.length + 1;
      const paymentId = `PM-${String(nextPayNum).padStart(6, '0')}`;
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
      await paymentRepository.create(payment);
    }

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

    await salesRepository.update(id, updatedSale);
    return updatedSale;
  },

  async deleteSale(id: string): Promise<void> {
    await salesRepository.delete(id);
    const relatedPayments = await paymentRepository.getBySaleId(id);
    for (const p of relatedPayments) {
      await paymentRepository.delete(p.id);
    }
  }
};
