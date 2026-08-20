import { db } from '../db/database';
import { Product } from '../types';

export const productRepository = {
  async getAll(): Promise<Product[]> {
    return await db.products.orderBy('name').toArray();
  },

  async getById(id: number): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  async create(product: Omit<Product, 'id'>): Promise<number> {
    const id = await db.products.add(product as Product);
    return id as number;
  },

  async update(id: number, updates: Partial<Product>): Promise<void> {
    await db.products.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: number): Promise<void> {
    await db.products.delete(id);
  },

  async count(): Promise<number> {
    return await db.products.count();
  },

  async clear(): Promise<void> {
    await db.products.clear();
  }
};
