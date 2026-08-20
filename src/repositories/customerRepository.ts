import { db } from '../db/database';
import { Customer } from '../types';

export const customerRepository = {
  async getAll(): Promise<Customer[]> {
    return await db.customers.toArray();
  },

  async getById(id: number): Promise<Customer | undefined> {
    return await db.customers.get(id);
  },

  async create(customer: Omit<Customer, 'id'>): Promise<number> {
    const id = await db.customers.add(customer as Customer);
    return id as number;
  },

  async update(id: number, customer: Partial<Customer>): Promise<void> {
    await db.customers.update(id, {
      ...customer,
      updatedAt: new Date().toISOString()
    });
  },

  async delete(id: number): Promise<void> {
    await db.customers.delete(id);
  },

  async count(): Promise<number> {
    return await db.customers.count();
  },

  async clear(): Promise<void> {
    await db.customers.clear();
  }
};
