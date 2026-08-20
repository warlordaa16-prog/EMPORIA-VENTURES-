export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT';
export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank' | 'Other';
export type UserRole = 'owner' | 'admin' | 'attendant';

export interface User {
  id?: number;
  username: string;
  fullName: string;
  role: UserRole;
  pin: string;
  phone?: string;
  shopName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: UserRole;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id?: number;
  name: string;
  unit: string;
  defaultPrice: number;
  category?: string;
  stockQuantity?: number; // Current on-hand quantity
  lowStockThreshold?: number; // User-defined threshold to trigger low stock visual alert
  trackStock?: boolean; // Whether stock alerts are enabled for this product
  sku?: string; // Product code / Barcode
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id?: number;
  saleId?: string;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string; // SP-000001
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  saleDate: string; // YYYY-MM-DDTHH:mm:ss
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: SaleItem[];
}

export interface Payment {
  id: string; // PM-000001
  customerId?: number;
  customerName: string;
  saleId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DDTHH:mm:ss
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ShopSettings {
  id?: number;
  shopName: string;
  phone: string;
  address: string;
  currency: string; // UGX
  receiptFooter: string;
  activeRole: UserRole;
  attendantName: string;
  ownerName: string;
  enablePin: boolean;
  pinCode?: string;
}

export interface CustomerSummary extends Customer {
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  salesCount: number;
  paymentsCount: number;
  lastActivityDate?: string;
}

export interface ReportStats {
  periodLabel: string;
  totalSales: number;
  paymentsReceived: number;
  outstandingCredit: number;
  transactionCount: number;
  cashReceived: number;
  mobileMoneyReceived: number;
  bankReceived: number;
  otherReceived: number;
  paidCount: number;
  partialCount: number;
  creditCount: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  shopName?: string;
  settings: ShopSettings;
  users?: User[];
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  saleItems: SaleItem[];
  payments: Payment[];
}

