import Dexie, { Table } from 'dexie';
import { Customer, Payment, Product, Sale, SaleItem, ShopSettings, User } from '../types';
import { DEFAULT_SETTINGS, SEED_CUSTOMERS, SEED_PRODUCTS, SEED_USERS } from './seedData';

export class ShopPayDatabase extends Dexie {
  users!: Table<User, number>;
  customers!: Table<Customer, number>;
  products!: Table<Product, number>;
  sales!: Table<Sale, string>;
  sale_items!: Table<SaleItem, number>;
  payments!: Table<Payment, string>;
  settings!: Table<ShopSettings, number>;

  constructor() {
    super('ShopPayDB');
    this.version(2).stores({
      users: '++id, username, role, createdAt',
      customers: '++id, name, phone, createdAt',
      products: '++id, name, defaultPrice, category, createdAt',
      sales: 'id, customerId, customerName, saleDate, status, paymentMethod, createdAt',
      sale_items: '++id, saleId, productId',
      payments: 'id, customerId, saleId, paymentDate, paymentMethod, createdAt',
      settings: '++id'
    });
  }
}

export const db = new ShopPayDatabase();

let initPromise: Promise<void> | null = null;

export async function initializeDatabase() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // 1. Sync or Initialize Users with updated Emporia passwords
    const existingUsers = await db.users.toArray();
    if (existingUsers.length === 0) {
      for (const u of SEED_USERS) {
        await db.users.add(u as User);
      }
    } else {
      // Synchronize and update passwords for default seed accounts
      for (const user of existingUsers) {
        if (user.username.toLowerCase() === 'owner' || user.username.toLowerCase() === 'admin') {
          await db.users.update(user.id!, {
            username: 'admin',
            fullName: 'Emporia Ventures',
            role: 'admin',
            pin: 'Eliana',
            shopName: 'Emporia Ventures Shop'
          });
        }
      }

      for (const seedUser of SEED_USERS) {
        const found = existingUsers.find(u => u.username.toLowerCase() === seedUser.username.toLowerCase());
        if (found) {
          if (found.pin !== seedUser.pin || found.shopName !== seedUser.shopName || found.fullName !== seedUser.fullName || found.role !== seedUser.role) {
            await db.users.update(found.id!, {
              pin: seedUser.pin,
              shopName: seedUser.shopName,
              fullName: seedUser.fullName,
              role: seedUser.role
            });
          }
        } else {
          await db.users.add(seedUser as User);
        }
      }
    }

    // 2. Settings Initialization & Sync
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({ ...DEFAULT_SETTINGS });
    } else {
      const currentSettings = await db.settings.toCollection().first();
      if (currentSettings) {
        await db.settings.update(currentSettings.id!, {
          shopName: DEFAULT_SETTINGS.shopName,
          phone: DEFAULT_SETTINGS.phone,
          address: DEFAULT_SETTINGS.address,
          receiptFooter: DEFAULT_SETTINGS.receiptFooter,
          ownerName: DEFAULT_SETTINGS.ownerName,
          attendantName: DEFAULT_SETTINGS.attendantName,
          pinCode: DEFAULT_SETTINGS.pinCode
        });
      }
    }

    // 3. Clean and Populate Products with accurate inventory thresholds
    const productsCount = await db.products.count();
    if (productsCount === 0) {
      for (const prod of SEED_PRODUCTS) {
        await db.products.add(prod as Product);
      }
    } else {
      const existingProducts = await db.products.toArray();
      for (const prod of existingProducts) {
        if (prod.stockQuantity === undefined || prod.lowStockThreshold === undefined) {
          const seedMatch = SEED_PRODUCTS.find(sp => sp.name.toLowerCase() === prod.name.toLowerCase());
          await db.products.update(prod.id!, {
            stockQuantity: prod.stockQuantity ?? seedMatch?.stockQuantity ?? 20,
            lowStockThreshold: prod.lowStockThreshold ?? seedMatch?.lowStockThreshold ?? 5,
            trackStock: prod.trackStock ?? true,
            sku: prod.sku ?? seedMatch?.sku ?? `EV-${prod.id}`
          });
        }
      }
    }

    // 4. Customers Initialization
    const customersCount = await db.customers.count();
    if (customersCount === 0) {
      for (const cust of SEED_CUSTOMERS) {
        await db.customers.add(cust as Customer);
      }
    }

    // 5. Clean fresh transaction seed: Remove old dummy demo sales/payments so app starts fresh for Emporia
    const legacySeedSale = await db.sales.get('SP-000001');
    if (legacySeedSale && (legacySeedSale.notes === 'Monthly staples' || legacySeedSale.createdBy === 'Emmanuel K.')) {
      await db.sales.clear();
      await db.sale_items.clear();
      await db.payments.clear();
    }
  })();
  return initPromise;
}
