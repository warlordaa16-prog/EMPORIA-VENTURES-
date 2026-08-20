import Dexie, { Table } from 'dexie';
import { Customer, Payment, Product, Sale, SaleItem, ShopSettings, User } from '../types';
import { DEFAULT_SETTINGS, SEED_CUSTOMERS, SEED_PRODUCTS, SEED_USERS, SHOWCASE_SALES_BLUEPRINTS } from './seedData';

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

export async function populateShowcaseData(force = false) {
  const currentSalesCount = await db.sales.count();
  if (currentSalesCount > 0 && !force) {
    return;
  }

  if (force) {
    await db.sales.clear();
    await db.sale_items.clear();
    await db.payments.clear();
    await db.customers.clear();
  }

  // 1. Seed or Ensure Customers exist
  const existingCustomers = await db.customers.toArray();
  const customerMap: Record<string, Customer> = {};

  for (const seedCust of SEED_CUSTOMERS) {
    let found = existingCustomers.find(c => c.name.toLowerCase() === seedCust.name.toLowerCase());
    if (!found) {
      const newId = await db.customers.add(seedCust as Customer);
      found = { ...seedCust, id: Number(newId) };
    }
    customerMap[found.name] = found;
  }

  // 2. Ensure Products exist and map by name
  const existingProducts = await db.products.toArray();
  const productMap: Record<string, Product> = {};

  for (const seedProd of SEED_PRODUCTS) {
    let found = existingProducts.find(p => p.name.toLowerCase() === seedProd.name.toLowerCase());
    if (!found) {
      const newId = await db.products.add(seedProd as Product);
      found = { ...seedProd, id: Number(newId) };
    }
    productMap[found.name] = found;
  }

  // 3. Generate dynamic showcase sales with items & payments
  let pmidCounter = 1;

  for (const blueprint of SHOWCASE_SALES_BLUEPRINTS) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - blueprint.daysAgo);
    dateObj.setHours(dateObj.getHours() + blueprint.hoursOffset);
    const saleDate = dateObj.toISOString();

    const customer = customerMap[blueprint.customerName];
    const customerId = customer ? customer.id : undefined;

    // Calculate items
    let subtotal = 0;
    const saleItemsToInsert: Omit<SaleItem, 'id'>[] = [];

    for (const it of blueprint.items) {
      const prod = productMap[it.productName];
      const lineSubtotal = it.quantity * it.unitPrice;
      subtotal += lineSubtotal;

      saleItemsToInsert.push({
        saleId: blueprint.id,
        productId: prod ? prod.id : undefined,
        description: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        subtotal: lineSubtotal
      });
    }

    const total = subtotal;
    const amountPaid = Math.round(total * blueprint.amountPaidFraction);
    const balance = Math.max(0, total - amountPaid);
    const status = balance === 0 ? 'PAID' : amountPaid === 0 ? 'CREDIT' : 'PARTIAL';

    const saleRecord: Sale = {
      id: blueprint.id,
      customerId,
      customerName: blueprint.customerName,
      customerPhone: blueprint.customerPhone,
      saleDate,
      subtotal,
      discount: 0,
      total,
      amountPaid,
      balance,
      status,
      paymentMethod: blueprint.paymentMethod,
      notes: blueprint.notes,
      createdBy: blueprint.createdBy,
      createdAt: saleDate,
      updatedAt: saleDate
    };

    await db.sales.put(saleRecord);

    for (const item of saleItemsToInsert) {
      await db.sale_items.add(item as SaleItem);
    }

    // Add initial payment record if amountPaid > 0
    if (amountPaid > 0) {
      const paymentId = `PM-${String(pmidCounter++).padStart(6, '0')}`;
      const paymentRecord: Payment = {
        id: paymentId,
        customerId,
        customerName: blueprint.customerName,
        saleId: blueprint.id,
        amount: amountPaid,
        paymentMethod: blueprint.paymentMethod,
        paymentDate: saleDate,
        notes: `Initial payment at checkout for invoice #${blueprint.id}`,
        createdBy: blueprint.createdBy,
        createdAt: saleDate
      };
      await db.payments.put(paymentRecord);
    }
  }

  // 4. Add follow-up installment debt payments to demonstrate customer ledger recovery
  const mamaBrian = customerMap['Mama Brian (Catering)'];
  if (mamaBrian && mamaBrian.id) {
    const pDate = new Date();
    pDate.setHours(pDate.getHours() - 1);
    const pmId = `PM-${String(pmidCounter++).padStart(6, '0')}`;
    await db.payments.put({
      id: pmId,
      customerId: mamaBrian.id,
      customerName: mamaBrian.name,
      saleId: 'SP-000108',
      amount: 25000,
      paymentMethod: 'Mobile Money',
      paymentDate: pDate.toISOString(),
      notes: 'Partial installment payment received via MTN Mobile Money',
      createdBy: 'Attendant',
      createdAt: pDate.toISOString()
    });
  }

  const uncleJoseph = customerMap['Uncle Joseph Kasule'];
  if (uncleJoseph && uncleJoseph.id) {
    const pDate = new Date();
    pDate.setDate(pDate.getDate() - 1);
    pDate.setHours(pDate.getHours() - 2);
    const pmId = `PM-${String(pmidCounter++).padStart(6, '0')}`;
    await db.payments.put({
      id: pmId,
      customerId: uncleJoseph.id,
      customerName: uncleJoseph.name,
      saleId: 'SP-000105',
      amount: 10000,
      paymentMethod: 'Cash',
      paymentDate: pDate.toISOString(),
      notes: 'Cash payment handed in-store towards weekly tab',
      createdBy: 'Attendant',
      createdAt: pDate.toISOString()
    });
  }
}

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
        const seedMatch = SEED_PRODUCTS.find(sp => sp.name.toLowerCase() === prod.name.toLowerCase());
        const updates: Partial<Product> = {};
        if (prod.stockQuantity === undefined || prod.lowStockThreshold === undefined) {
          updates.stockQuantity = prod.stockQuantity ?? seedMatch?.stockQuantity ?? 20;
          updates.lowStockThreshold = prod.lowStockThreshold ?? seedMatch?.lowStockThreshold ?? 5;
          updates.trackStock = prod.trackStock ?? true;
          updates.sku = prod.sku ?? seedMatch?.sku ?? `EV-${prod.id}`;
        }
        if (prod.costPrice === undefined) {
          updates.costPrice = seedMatch?.costPrice ?? Math.round(prod.defaultPrice * 0.75);
        }
        if (Object.keys(updates).length > 0) {
          await db.products.update(prod.id!, updates);
        }
      }
    }

    // 4. Seed Showcase Data if sales are empty
    await populateShowcaseData(false);
  })();
  return initPromise;
}

