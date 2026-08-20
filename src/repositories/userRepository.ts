import { db } from '../db/database';
import { User } from '../types';

export const userRepository = {
  async getAll(): Promise<User[]> {
    return await db.users.toArray();
  },

  async getById(id: number): Promise<User | undefined> {
    return await db.users.get(id);
  },

  async getByUsername(username: string): Promise<User | undefined> {
    return await db.users.where('username').equalsIgnoreCase(username.trim()).first();
  },

  async create(user: Omit<User, 'id'>): Promise<number> {
    const id = await db.users.add(user as User);
    return id as number;
  },

  async update(id: number, updates: Partial<User>): Promise<void> {
    await db.users.update(id, updates);
  },

  async delete(id: number): Promise<void> {
    await db.users.delete(id);
  },

  async count(): Promise<number> {
    return await db.users.count();
  },

  async clear(): Promise<void> {
    await db.users.clear();
  }
};
