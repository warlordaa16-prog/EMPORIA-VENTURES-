import { Customer, Payment, Product, Sale, SaleItem, ShopSettings } from '../types';

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Kampa Fresh & General Stores',
  phone: '+256 772 123 456',
  address: 'Plot 14 Kampala Road, Central Market',
  currency: 'UGX',
  receiptFooter: 'Thank you for shopping with us! Please keep this receipt.',
  activeRole: 'owner',
  attendantName: 'Sarah K.',
  ownerName: 'Emmanuel K.',
  enablePin: false,
  pinCode: '1234'
};

export const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Sugar 1kg', unit: 'packet', defaultPrice: 4500, category: 'Groceries', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Basmati Rice 1kg', unit: 'kg', defaultPrice: 6000, category: 'Groceries', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Cooking Oil 1L', unit: 'bottle', defaultPrice: 9500, category: 'Cooking', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Laundry Bar Soap (White)', unit: 'bar', defaultPrice: 3500, category: 'Household', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Wheat Flour 2kg', unit: 'packet', defaultPrice: 7000, category: 'Baking', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Fresh Milk 500ml', unit: 'pouch', defaultPrice: 2000, category: 'Dairy', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Family Bread 500g', unit: 'loaf', defaultPrice: 4500, category: 'Bakery', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Soda 300ml Glass Bottle', unit: 'bottle', defaultPrice: 1500, category: 'Beverages', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Salt 500g', unit: 'packet', defaultPrice: 1200, category: 'Groceries', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Tea Leaves 100g', unit: 'box', defaultPrice: 2500, category: 'Beverages', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Box of Matches', unit: 'box', defaultPrice: 500, category: 'Household', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Eggs (Tray of 30)', unit: 'tray', defaultPrice: 14000, category: 'Poultry', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const SEED_CUSTOMERS: Omit<Customer, 'id'>[] = [
  {
    name: 'John Doe',
    phone: '+256 701 987 654',
    address: 'Block 4, Flat 12',
    notes: 'Regular customer, pays end of month',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    name: 'Mary Namubiru',
    phone: '+256 782 456 789',
    address: 'Market Street, Shop 8',
    notes: 'Neighboring salon owner',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    name: 'David Otim',
    phone: '+256 753 112 233',
    address: 'Near Taxi Park',
    notes: 'Prefers Mobile Money',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    name: 'Grace Akello',
    phone: '+256 774 990 011',
    address: 'Church Road',
    notes: 'Always pays in cash',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];
