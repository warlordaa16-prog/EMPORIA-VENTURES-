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
  { name: 'Super Maize Flour 5kg', unit: 'packet', defaultPrice: 16000, costPrice: 12500, category: 'Groceries', stockQuantity: 15, lowStockThreshold: 5, trackStock: true, sku: 'EV-GR-004', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Fresh Milk 500ml', unit: 'pouch', defaultPrice: 2000, costPrice: 1400, category: 'Dairy', stockQuantity: 4, lowStockThreshold: 12, trackStock: true, sku: 'EV-DY-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Family Bread 500g', unit: 'loaf', defaultPrice: 4500, costPrice: 3200, category: 'Bakery', stockQuantity: 0, lowStockThreshold: 5, trackStock: true, sku: 'EV-BK-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Soda 300ml Glass Bottle', unit: 'bottle', defaultPrice: 1500, costPrice: 1000, category: 'Beverages', stockQuantity: 60, lowStockThreshold: 15, trackStock: true, sku: 'EV-BV-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Table Salt 500g', unit: 'packet', defaultPrice: 1200, costPrice: 700, category: 'Groceries', stockQuantity: 50, lowStockThreshold: 10, trackStock: true, sku: 'EV-GR-003', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Premium Tea Leaves 100g', unit: 'box', defaultPrice: 2500, costPrice: 1700, category: 'Beverages', stockQuantity: 5, lowStockThreshold: 8, trackStock: true, sku: 'EV-BV-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Safety Matches (Pack of 10)', unit: 'pack', defaultPrice: 2000, costPrice: 1300, category: 'Household', stockQuantity: 30, lowStockThreshold: 5, trackStock: true, sku: 'EV-HH-002', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Fresh Farm Eggs (Tray of 30)', unit: 'tray', defaultPrice: 15000, costPrice: 11500, category: 'Poultry', stockQuantity: 7, lowStockThreshold: 10, trackStock: true, sku: 'EV-PL-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Mineral Water 500ml (Pack of 12)', unit: 'pack', defaultPrice: 12000, costPrice: 9000, category: 'Beverages', stockQuantity: 14, lowStockThreshold: 4, trackStock: true, sku: 'EV-BV-003', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Washing Powder 1kg', unit: 'packet', defaultPrice: 8500, costPrice: 6200, category: 'Household', stockQuantity: 16, lowStockThreshold: 5, trackStock: true, sku: 'EV-HH-003', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: 'Spaghetti Pasta 500g', unit: 'packet', defaultPrice: 4000, costPrice: 2800, category: 'Groceries', stockQuantity: 22, lowStockThreshold: 6, trackStock: true, sku: 'EV-GR-005', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const SEED_CUSTOMERS: Omit<Customer, 'id'>[] = [
  {
    name: 'Mama Brian (Catering)',
    phone: '+256 772 334 112',
    address: 'Plot 14 Central Market Road',
    notes: 'Frequent catering bulk buyer. Has ongoing weekly credit agreement.',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Dr. Ronald Kato',
    phone: '+256 701 445 566',
    address: 'Victoria Gardens Villa 12',
    notes: 'Regular household buyer. Pays via Mobile Money or Cash.',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Prossy Nalwanga',
    phone: '+256 755 889 001',
    address: 'Block C Apt 3, Emporia St',
    notes: 'Office pantry manager. Always requests itemized receipt for petty cash.',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Uncle Joseph Kasule',
    phone: '+256 782 119 922',
    address: 'Plot 8 Sunset Rd',
    notes: 'Neighbourhood elder. Buys weekly staples on short-term credit.',
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Sarah Nakato (Clinic)',
    phone: '+256 704 667 889',
    address: 'St. Jude Clinic Reception',
    notes: 'Buys clinic staff refreshments & cleaning detergent monthly.',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: 'Dennis Mukasa',
    phone: '+256 770 990 123',
    address: 'Victoria Auto Hub Garage',
    notes: 'Garage supervisor, frequent beverages and sugar walk-in buyer.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export interface ShowcaseSaleBlueprint {
  id: string;
  customerName: string;
  customerPhone?: string;
  daysAgo: number; // 0 = today, 1 = yesterday, etc.
  hoursOffset: number; // e.g. 10 for 10am
  paymentMethod: 'Cash' | 'Mobile Money' | 'Bank' | 'Other';
  amountPaidFraction: number; // 1 = fully paid, 0.5 = half paid, 0 = pure credit
  notes?: string;
  createdBy: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
  }[];
}

export const SHOWCASE_SALES_BLUEPRINTS: ShowcaseSaleBlueprint[] = [
  // TODAY's Transactions (Immediate vibrant KPIs on Homepage!)
  {
    id: 'SP-000101',
    customerName: 'Dr. Ronald Kato',
    customerPhone: '+256 701 445 566',
    daysAgo: 0,
    hoursOffset: -5, // e.g. morning today
    paymentMethod: 'Cash',
    amountPaidFraction: 1,
    notes: 'Family groceries weekend restock',
    createdBy: 'Attendant',
    items: [
      { productName: 'Pure Cooking Oil 1L', quantity: 2, unitPrice: 9500, costPrice: 7200 },
      { productName: 'Wheat Flour 2kg', quantity: 1, unitPrice: 7000, costPrice: 5200 },
      { productName: 'Fresh Farm Eggs (Tray of 30)', quantity: 1, unitPrice: 15000, costPrice: 11500 },
      { productName: 'Sugar 1kg (Premium)', quantity: 2, unitPrice: 4500, costPrice: 3400 }
    ]
  },
  {
    id: 'SP-000102',
    customerName: 'Dennis Mukasa',
    customerPhone: '+256 770 990 123',
    daysAgo: 0,
    hoursOffset: -3.5, // mid-day today
    paymentMethod: 'Cash',
    amountPaidFraction: 1,
    notes: 'Walk-in cash counter sale',
    createdBy: 'Attendant',
    items: [
      { productName: 'Soda 300ml Glass Bottle', quantity: 4, unitPrice: 1500, costPrice: 1000 },
      { productName: 'Table Salt 500g', quantity: 2, unitPrice: 1200, costPrice: 700 },
      { productName: 'Sugar 1kg (Premium)', quantity: 1, unitPrice: 4500, costPrice: 3400 }
    ]
  },
  {
    id: 'SP-000103',
    customerName: 'Mama Brian (Catering)',
    customerPhone: '+256 772 334 112',
    daysAgo: 0,
    hoursOffset: -2, // afternoon today
    paymentMethod: 'Mobile Money',
    amountPaidFraction: 0.6, // Partial payment (Credit sale)
    notes: 'Catering ingredients for Saturday reception - partial advance paid',
    createdBy: 'Attendant',
    items: [
      { productName: 'Basmati Royal Rice 1kg', quantity: 3, unitPrice: 6500, costPrice: 4800 },
      { productName: 'Fresh Farm Eggs (Tray of 30)', quantity: 2, unitPrice: 15000, costPrice: 11500 },
      { productName: 'Pure Cooking Oil 1L', quantity: 2, unitPrice: 9500, costPrice: 7200 },
      { productName: 'Spaghetti Pasta 500g', quantity: 2, unitPrice: 4000, costPrice: 2800 }
    ]
  },
  {
    id: 'SP-000104',
    customerName: 'Prossy Nalwanga',
    customerPhone: '+256 755 889 001',
    daysAgo: 0,
    hoursOffset: -0.8, // recently today
    paymentMethod: 'Mobile Money',
    amountPaidFraction: 1,
    notes: 'Corporate pantry supplies',
    createdBy: 'Attendant',
    items: [
      { productName: 'Premium Tea Leaves 100g', quantity: 3, unitPrice: 2500, costPrice: 1700 },
      { productName: 'Fresh Milk 500ml', quantity: 4, unitPrice: 2000, costPrice: 1400 },
      { productName: 'Sugar 1kg (Premium)', quantity: 2, unitPrice: 4500, costPrice: 3400 }
    ]
  },

  // YESTERDAY's Transactions
  {
    id: 'SP-000105',
    customerName: 'Uncle Joseph Kasule',
    customerPhone: '+256 782 119 922',
    daysAgo: 1,
    hoursOffset: -4,
    paymentMethod: 'Cash',
    amountPaidFraction: 0.25, // Partial credit
    notes: 'Weekly household supplies taken on credit',
    createdBy: 'Attendant',
    items: [
      { productName: 'Sugar 1kg (Premium)', quantity: 2, unitPrice: 4500, costPrice: 3400 },
      { productName: 'Wheat Flour 2kg', quantity: 1, unitPrice: 7000, costPrice: 5200 },
      { productName: 'Laundry Bar Soap (White)', quantity: 1, unitPrice: 3500, costPrice: 2400 },
      { productName: 'Table Salt 500g', quantity: 1, unitPrice: 1200, costPrice: 700 }
    ]
  },
  {
    id: 'SP-000106',
    customerName: 'Sarah Nakato (Clinic)',
    customerPhone: '+256 704 667 889',
    daysAgo: 1,
    hoursOffset: -2.5,
    paymentMethod: 'Bank',
    amountPaidFraction: 1,
    notes: 'Monthly clinic staff welfare purchase',
    createdBy: 'Attendant',
    items: [
      { productName: 'Washing Powder 1kg', quantity: 2, unitPrice: 8500, costPrice: 6200 },
      { productName: 'Laundry Bar Soap (White)', quantity: 4, unitPrice: 3500, costPrice: 2400 },
      { productName: 'Premium Tea Leaves 100g', quantity: 2, unitPrice: 2500, costPrice: 1700 },
      { productName: 'Mineral Water 500ml (Pack of 12)', quantity: 1, unitPrice: 12000, costPrice: 9000 }
    ]
  },
  {
    id: 'SP-000107',
    customerName: 'Dennis Mukasa',
    customerPhone: '+256 770 990 123',
    daysAgo: 1,
    hoursOffset: -1,
    paymentMethod: 'Cash',
    amountPaidFraction: 1,
    notes: 'Garage break time supplies',
    createdBy: 'Attendant',
    items: [
      { productName: 'Soda 300ml Glass Bottle', quantity: 8, unitPrice: 1500, costPrice: 1000 },
      { productName: 'Sugar 1kg (Premium)', quantity: 1, unitPrice: 4500, costPrice: 3400 }
    ]
  },

  // EARLIER THIS WEEK / MONTH Transactions
  {
    id: 'SP-000108',
    customerName: 'Mama Brian (Catering)',
    customerPhone: '+256 772 334 112',
    daysAgo: 3,
    hoursOffset: -3,
    paymentMethod: 'Mobile Money',
    amountPaidFraction: 0.65,
    notes: 'Bulk wedding banquet provisions',
    createdBy: 'Attendant',
    items: [
      { productName: 'Super Maize Flour 5kg', quantity: 2, unitPrice: 16000, costPrice: 12500 },
      { productName: 'Pure Cooking Oil 1L', quantity: 3, unitPrice: 9500, costPrice: 7200 },
      { productName: 'Fresh Farm Eggs (Tray of 30)', quantity: 2, unitPrice: 15000, costPrice: 11500 }
    ]
  },
  {
    id: 'SP-000109',
    customerName: 'Dr. Ronald Kato',
    customerPhone: '+256 701 445 566',
    daysAgo: 4,
    hoursOffset: -2,
    paymentMethod: 'Mobile Money',
    amountPaidFraction: 1,
    notes: 'Monthly staples package',
    createdBy: 'Attendant',
    items: [
      { productName: 'Super Maize Flour 5kg', quantity: 1, unitPrice: 16000, costPrice: 12500 },
      { productName: 'Basmati Royal Rice 1kg', quantity: 2, unitPrice: 6500, costPrice: 4800 },
      { productName: 'Pure Cooking Oil 1L', quantity: 2, unitPrice: 9500, costPrice: 7200 },
      { productName: 'Spaghetti Pasta 500g', quantity: 3, unitPrice: 4000, costPrice: 2800 }
    ]
  },
  {
    id: 'SP-000110',
    customerName: 'Uncle Joseph Kasule',
    customerPhone: '+256 782 119 922',
    daysAgo: 6,
    hoursOffset: -4,
    paymentMethod: 'Cash',
    amountPaidFraction: 1,
    notes: 'Settled fully at store',
    createdBy: 'Attendant',
    items: [
      { productName: 'Sugar 1kg (Premium)', quantity: 2, unitPrice: 4500, costPrice: 3400 },
      { productName: 'Fresh Milk 500ml', quantity: 2, unitPrice: 2000, costPrice: 1400 },
      { productName: 'Safety Matches (Pack of 10)', quantity: 1, unitPrice: 2000, costPrice: 1300 }
    ]
  },
  {
    id: 'SP-000111',
    customerName: 'Prossy Nalwanga',
    customerPhone: '+256 755 889 001',
    daysAgo: 8,
    hoursOffset: -3,
    paymentMethod: 'Cash',
    amountPaidFraction: 1,
    notes: 'Monthly office cleaning supplies',
    createdBy: 'Attendant',
    items: [
      { productName: 'Washing Powder 1kg', quantity: 2, unitPrice: 8500, costPrice: 6200 },
      { productName: 'Laundry Bar Soap (White)', quantity: 4, unitPrice: 3500, costPrice: 2400 },
      { productName: 'Table Salt 500g', quantity: 2, unitPrice: 1200, costPrice: 700 }
    ]
  }
];

