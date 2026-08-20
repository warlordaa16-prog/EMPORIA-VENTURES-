import { Customer, Payment, Product, Sale, SaleItem, ShopSettings, User } from '../types';

export const SEED_USERS: Omit<User, 'id'>[] = [
  {
    username: 'admin',
    fullName: 'Emporia Ventures',
    role: 'admin',
    pin: 'Eliana',
    phone: '+256 700 889 900',
    shopName: 'Emporia Ventures Shop',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    username: 'attendant',
    fullName: 'Attendant',
    role: 'attendant',
    pin: 'Emporia00',
    phone: '+256 701 234 567',
    shopName: 'Emporia Ventures Shop',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastLogin: new Date().toISOString()
  }
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Emporia Ventures Shop',
  phone: '+256 700 889 900',
  address: 'Victoria Mall Suite 4B, Emporia Boulevard',
  currency: 'UGX',
  receiptFooter: 'Thank you for shopping at Emporia Ventures! Quality & Value Guaranteed. Please keep this receipt.',
  activeRole: 'attendant',
  attendantName: 'Attendant',
  ownerName: 'Emporia Ventures',
  enablePin: false,
  pinCode: 'Eliana'
};

export const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Sugar 1kg (Premium)', unit: 'packet', defaultPrice: 4500, costPrice: 3400, category: 'Groceries', stockQuantity: 42, lowStockThreshold: 10, trackStock: true, sku: 'EV-GR-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Basmati Royal Rice 1kg', unit: 'kg', defaultPrice: 6500, costPrice: 4800, category: 'Groceries', stockQuantity: 3, lowStockThreshold: 8, trackStock: true, sku: 'EV-GR-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Pure Cooking Oil 1L', unit: 'bottle', defaultPrice: 9500, costPrice: 7200, category: 'Cooking', stockQuantity: 18, lowStockThreshold: 5, trackStock: true, sku: 'EV-CK-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Laundry Bar Soap (White)', unit: 'bar', defaultPrice: 3500, costPrice: 2400, category: 'Household', stockQuantity: 2, lowStockThreshold: 10, trackStock: true, sku: 'EV-HH-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Wheat Flour 2kg', unit: 'packet', defaultPrice: 7000, costPrice: 5200, category: 'Baking', stockQuantity: 25, lowStockThreshold: 6, trackStock: true, sku: 'EV-BK-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Fresh Milk 500ml', unit: 'pouch', defaultPrice: 2000, costPrice: 1400, category: 'Dairy', stockQuantity: 4, lowStockThreshold: 12, trackStock: true, sku: 'EV-DY-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Family Bread 500g', unit: 'loaf', defaultPrice: 4500, costPrice: 3200, category: 'Bakery', stockQuantity: 0, lowStockThreshold: 5, trackStock: true, sku: 'EV-BK-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Soda 300ml Glass Bottle', unit: 'bottle', defaultPrice: 1500, costPrice: 1000, category: 'Beverages', stockQuantity: 60, lowStockThreshold: 15, trackStock: true, sku: 'EV-BV-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Table Salt 500g', unit: 'packet', defaultPrice: 1200, costPrice: 700, category: 'Groceries', stockQuantity: 50, lowStockThreshold: 10, trackStock: true, sku: 'EV-GR-003', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Premium Tea Leaves 100g', unit: 'box', defaultPrice: 2500, costPrice: 1700, category: 'Beverages', stockQuantity: 5, lowStockThreshold: 8, trackStock: true, sku: 'EV-BV-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Safety Matches (Pack of 10)', unit: 'pack', defaultPrice: 2000, costPrice: 1300, category: 'Household', stockQuantity: 30, lowStockThreshold: 5, trackStock: true, sku: 'EV-HH-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Fresh Farm Eggs (Tray of 30)', unit: 'tray', defaultPrice: 15000, costPrice: 11500, category: 'Poultry', stockQuantity: 7, lowStockThreshold: 10, trackStock: true, sku: 'EV-PL-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const SEED_CUSTOMERS: Omit<Customer, 'id'>[] = [];
