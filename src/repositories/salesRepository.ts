import { db } from '../db/database';
import { Sale, SaleItem } from '../types';

export const salesRepository = {
  async getAll(): Promise<Sale[]> {
    return await db.sales.orderBy('saleDate').reverse().toArray();
  },

  async getById(id: string): Promise<Sale | undefined> {
    return await db.sales.get(id);
  },

  async getByCustomerId(customerId: number): Promise<Sale[]> {
    return await db.sales.where('customerId').equals(customerId).toArray();
  },

  async create(sale: Sale, items: SaleItem[]): Promise<string> {
    await db.transaction('rw', db.sales, db.sale_items, async () => {
      await db.sales.add(sale);
      if (items.length > 0) {
        const itemsWithSaleId = items.map(it => ({ ...it, saleId: sale.id }));
        await db.sale_items.bulkAdd(itemsWithSaleId);
      }
    });
    return sale.id;
  },

  async update(id: string, updates: Partial<Sale>): Promise<void> {
    await db.sales.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', db.sales, db.sale_items, async () => {
      await db.sales.delete(id);
      await db.sale_items.where('saleId').equals(id).delete();
    });
  },

  async getItemsBySaleId(saleId: string): Promise<SaleItem[]> {
    return await db.sale_items.where('saleId').equals(saleId).toArray();
  },

  async getAllSaleItems(): Promise<SaleItem[]> {
    return await db.sale_items.toArray();
  },

  async count(): Promise<number> {
    return await db.sales.count();
  },

  async clear(): Promise<void> {
    await db.transaction('rw', db.sales, db.sale_items, async () => {
      await db.sales.clear();
      await db.sale_items.clear();
    });
  }
};
