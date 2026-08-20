import { productRepository } from '../repositories/productRepository';
import { Product } from '../types';

export const productService = {
  async getAll(): Promise<Product[]> {
    return await productRepository.getAll();
  },

  async getById(id: number): Promise<Product | undefined> {
    return await productRepository.getById(id);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const all = await productRepository.getAll();
    return all.filter(p => {
      if (p.trackStock === false) return false;
      const stock = p.stockQuantity ?? 0;
      const threshold = p.lowStockThreshold ?? 5;
      return stock <= threshold;
    });
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const newProduct: Omit<Product, 'id'> = {
      ...product,
      name: product.name.trim(),
      unit: product.unit.trim() || 'unit',
      defaultPrice: Number(product.defaultPrice) || 0,
      category: product.category?.trim() || 'General',
      stockQuantity: product.stockQuantity !== undefined ? Number(product.stockQuantity) : 20,
      lowStockThreshold: product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : 5,
      trackStock: product.trackStock !== undefined ? Boolean(product.trackStock) : true,
      sku: product.sku?.trim() || `EV-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: now,
      updatedAt: now
    };
    const id = await productRepository.create(newProduct);
    return { ...newProduct, id };
  },

  async update(id: number, product: Partial<Product>): Promise<Product> {
    const existing = await productRepository.getById(id);
    if (!existing) throw new Error('Product not found');
    const updated: Product = {
      ...existing,
      ...product,
      name: product.name !== undefined ? product.name.trim() : existing.name,
      unit: product.unit !== undefined ? product.unit.trim() : existing.unit,
      defaultPrice: product.defaultPrice !== undefined ? Number(product.defaultPrice) : existing.defaultPrice,
      category: product.category !== undefined ? product.category.trim() : existing.category,
      stockQuantity: product.stockQuantity !== undefined ? Number(product.stockQuantity) : existing.stockQuantity,
      lowStockThreshold: product.lowStockThreshold !== undefined ? Number(product.lowStockThreshold) : existing.lowStockThreshold,
      trackStock: product.trackStock !== undefined ? Boolean(product.trackStock) : existing.trackStock,
      sku: product.sku !== undefined ? product.sku.trim() : existing.sku,
      updatedAt: new Date().toISOString()
    };
    await productRepository.update(id, updated);
    return updated;
  },

  async restockProduct(id: number, addedQuantity: number): Promise<Product> {
    const existing = await productRepository.getById(id);
    if (!existing) throw new Error('Product not found');
    const currentStock = existing.stockQuantity ?? 0;
    const newStock = Math.max(0, currentStock + Number(addedQuantity));
    return await this.update(id, { stockQuantity: newStock });
  },

  async delete(id: number): Promise<void> {
    await productRepository.delete(id);
  }
};

