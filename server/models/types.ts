export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'inactive';
export type StockStatus = 'available' | 'limited' | 'out_of_stock' | 'inactive';
export type PaymentMethod = 'cash' | 'upi';
export type BillStatus = 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameBn: string;
  categoryId: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
  purchasePrice?: number;
  sellingPrice: number;
  unit: string;
  stockStatus: StockStatus;
  location: string;
  imageUrl?: string;
  imagePublicId?: string;
  active: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  productNameEn: string;
  productNameBn: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  changedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface ShopSnapshot {
  shopName: string;
  adminName: string;
  address: string;
  mobile: string;
  logoUrl?: string;
  upiQrUrl?: string;
}

export interface Bill {
  id: string;
  billNumber: string; // BILL-YYYYMMDD-001
  billDate: string;
  createdBy: string;
  createdByName: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  items: BillItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  dueAmount: number;
  status: BillStatus;
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancellationReason?: string;
  shopSnapshot: ShopSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentProof {
  url: string;
  publicId?: string;
  uploadedAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  billId?: string;
  billNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  proofImages: string[];
  note?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  adminName: string;
  address: string;
  mobile: string;
  logoUrl?: string;
  logoPublicId?: string;
  upiQrUrl?: string;
  upiQrPublicId?: string;
  upiId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'price' | 'product' | 'user' | 'bill' | 'settings';
  details: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}
