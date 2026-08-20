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
    const usersCount = await db.users.count();
    if (usersCount === 0) {
      for (const u of SEED_USERS) {
        const exists = await db.users.where('username').equalsIgnoreCase(u.username).first();
        if (!exists) {
          await db.users.add(u as User);
        }
      }
    }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({ ...DEFAULT_SETTINGS });
  } else {
    const currentSettings = await db.settings.toCollection().first();
    if (currentSettings && (currentSettings.shopName === 'Kampa Fresh & General Stores' || currentSettings.shopName.includes('Kampa'))) {
      await db.settings.update(currentSettings.id!, {
        shopName: DEFAULT_SETTINGS.shopName,
        phone: DEFAULT_SETTINGS.phone,
        address: DEFAULT_SETTINGS.address,
        receiptFooter: DEFAULT_SETTINGS.receiptFooter,
        ownerName: DEFAULT_SETTINGS.ownerName,
        attendantName: DEFAULT_SETTINGS.attendantName
      });
    }
  }

  const productsCount = await db.products.count();
  if (productsCount === 0) {
    for (const prod of SEED_PRODUCTS) {
      await db.products.add(prod as Product);
    }
  } else {
    // Migration: populate stockQuantity and lowStockThreshold for products if missing
    const existingProducts = await db.products.toArray();
    for (const prod of existingProducts) {
      if (prod.stockQuantity === undefined || prod.lowStockThreshold === undefined) {
        const seedMatch = SEED_PRODUCTS.find(sp => sp.name.toLowerCase() === prod.name.toLowerCase());
        await db.products.update(prod.id!, {
          stockQuantity: prod.stockQuantity ?? seedMatch?.stockQuantity ?? 15,
          lowStockThreshold: prod.lowStockThreshold ?? seedMatch?.lowStockThreshold ?? 5,
          trackStock: prod.trackStock ?? true,
          sku: prod.sku ?? seedMatch?.sku ?? `EV-${prod.id}`
        });
      }
    }
  }

  const customersCount = await db.customers.count();
  if (customersCount === 0) {
    const custIds: number[] = [];
    for (const cust of SEED_CUSTOMERS) {
      const id = await db.customers.add(cust as Customer);
      custIds.push(id as number);
    }

    // Add initial seed sales demonstrating paid, partial, credit
    const now = Date.now();
    const todayIso = new Date().toISOString();
    const yesterdayIso = new Date(now - 86400000).toISOString();
    const twoDaysAgoIso = new Date(now - 2 * 86400000).toISOString();

    // Sale 1: SP-000001 (John Doe - Partial / Credit)
    const s1Id = 'SP-000001';
    await db.sales.add({
      id: s1Id,
      customerId: custIds[0],
      customerName: 'John Doe',
      customerPhone: '+256 701 987 654',
      saleDate: twoDaysAgoIso,
      subtotal: 100000,
      discount: 0,
      total: 100000,
      amountPaid: 40000,
      balance: 60000,
      status: 'PARTIAL',
      paymentMethod: 'Cash',
      notes: 'Monthly staples',
      createdBy: 'Emmanuel K.',
      createdAt: twoDaysAgoIso,
      updatedAt: twoDaysAgoIso
    });
    await db.sale_items.bulkAdd([
      { saleId: s1Id, description: 'Sugar 1kg', quantity: 4, unitPrice: 4500, subtotal: 18000 },
      { saleId: s1Id, description: 'Cooking Oil 1L', quantity: 4, unitPrice: 9500, subtotal: 38000 },
      { saleId: s1Id, description: 'Basmati Rice 1kg', quantity: 7, unitPrice: 6000, subtotal: 42000 },
      { saleId: s1Id, description: 'Tea Leaves 100g', quantity: 1, unitPrice: 2000, subtotal: 2000 }
    ]);
    await db.payments.add({
      id: 'PM-000001',
      customerId: custIds[0],
      customerName: 'John Doe',
      saleId: s1Id,
      amount: 40000,
      paymentMethod: 'Cash',
      paymentDate: twoDaysAgoIso,
      notes: 'Deposit on sale SP-000001',
      createdBy: 'Emmanuel K.',
      createdAt: twoDaysAgoIso
    });

    // Sale 2: SP-000002 (John Doe - Unpaid Credit)
    const s2Id = 'SP-000002';
    await db.sales.add({
      id: s2Id,
      customerId: custIds[0],
      customerName: 'John Doe',
      customerPhone: '+256 701 987 654',
      saleDate: yesterdayIso,
      subtotal: 50000,
      discount: 0,
      total: 50000,
      amountPaid: 0,
      balance: 50000,
      status: 'CREDIT',
      paymentMethod: 'Cash',
      notes: 'Sent son to collect',
      createdBy: 'Sarah K.',
      createdAt: yesterdayIso,
      updatedAt: yesterdayIso
    });
    await db.sale_items.bulkAdd([
      { saleId: s2Id, description: 'Wheat Flour 2kg', quantity: 5, unitPrice: 7000, subtotal: 35000 },
      { saleId: s2Id, description: 'Eggs (Tray of 30)', quantity: 1, unitPrice: 14000, subtotal: 14000 },
      { saleId: s2Id, description: 'Box of Matches', quantity: 2, unitPrice: 500, subtotal: 1000 }
    ]);

    // Payment on John Doe's balance yesterday
    await db.payments.add({
      id: 'PM-000002',
      customerId: custIds[0],
      customerName: 'John Doe',
      amount: 50000,
      paymentMethod: 'Mobile Money',
      paymentDate: yesterdayIso,
      notes: 'Mobile Money part-payment via MTN',
      createdBy: 'Sarah K.',
      createdAt: yesterdayIso
    });

    // Sale 3: SP-000003 (Mary Namubiru - Paid in full)
    const s3Id = 'SP-000003';
    await db.sales.add({
      id: s3Id,
      customerId: custIds[1],
      customerName: 'Mary Namubiru',
      customerPhone: '+256 782 456 789',
      saleDate: todayIso,
      subtotal: 38000,
      discount: 1000,
      total: 37000,
      amountPaid: 37000,
      balance: 0,
      status: 'PAID',
      paymentMethod: 'Mobile Money',
      notes: 'Salon tea & supplies',
      createdBy: 'Sarah K.',
      createdAt: todayIso,
      updatedAt: todayIso
    });
    await db.sale_items.bulkAdd([
      { saleId: s3Id, description: 'Sugar 1kg', quantity: 2, unitPrice: 4500, subtotal: 9000 },
      { saleId: s3Id, description: 'Fresh Milk 500ml', quantity: 5, unitPrice: 2000, subtotal: 10000 },
      { saleId: s3Id, description: 'Family Bread 500g', quantity: 4, unitPrice: 4500, subtotal: 18000 },
      { saleId: s3Id, description: 'Tea Leaves 100g', quantity: 1, unitPrice: 2000, subtotal: 2000 }
    ]);
    await db.payments.add({
      id: 'PM-000003',
      customerId: custIds[1],
      customerName: 'Mary Namubiru',
      saleId: s3Id,
      amount: 37000,
      paymentMethod: 'Mobile Money',
      paymentDate: todayIso,
      notes: 'Airtel Money transfer',
      createdBy: 'Sarah K.',
      createdAt: todayIso
    });

    // Sale 4: SP-000004 (Walk-in Customer - Paid Cash)
    const s4Id = 'SP-000004';
    await db.sales.add({
      id: s4Id,
      customerName: 'Walk-in Customer',
      customerPhone: '',
      saleDate: todayIso,
      subtotal: 14500,
      discount: 0,
      total: 14500,
      amountPaid: 14500,
      balance: 0,
      status: 'PAID',
      paymentMethod: 'Cash',
      notes: 'Counter cash sale',
      createdBy: 'Sarah K.',
      createdAt: todayIso,
      updatedAt: todayIso
    });
    await db.sale_items.bulkAdd([
      { saleId: s4Id, description: 'Cooking Oil 1L', quantity: 1, unitPrice: 9500, subtotal: 9500 },
      { saleId: s4Id, description: 'Sugar 1kg', quantity: 1, unitPrice: 4500, subtotal: 4500 },
      { saleId: s4Id, description: 'Box of Matches', quantity: 1, unitPrice: 500, subtotal: 500 }
    ]);
    await db.payments.add({
      id: 'PM-000004',
      customerName: 'Walk-in Customer',
      saleId: s4Id,
      amount: 14500,
      paymentMethod: 'Cash',
      paymentDate: todayIso,
      notes: 'Cash received at counter',
      createdBy: 'Sarah K.',
      createdAt: todayIso
    });
    }
  })();
  return initPromise;
}
