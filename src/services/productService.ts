import { db } from '../db/database';
import { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    return await db.products.toArray();
  },

  async getById(id: number): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      name: product.name.trim(),
      unit: product.unit.trim() || 'unit',
      defaultPrice: Number(product.defaultPrice) || 0,
      category: product.category?.trim() || 'General',
      createdAt: now,
      updatedAt: now
    };
    const id = await db.products.add(newProduct);
    return { ...newProduct, id: id as number };
  },

  async update(id: number, product: Partial<Product>): Promise<Product> {
    const existing = await db.products.get(id);
    if (!existing) throw new Error('Product not found');
    const updated: Product = {
      ...existing,
      ...product,
      updatedAt: new Date().toISOString()
    };
    await db.products.put(updated);
    return updated;
  },

  async delete(id: number): Promise<void> {
    await db.products.delete(id);
  }
};
