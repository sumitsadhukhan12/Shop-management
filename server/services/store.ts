import fs from 'fs';
import path from 'path';
import {
  User,
  Category,
  Product,
  PriceHistory,
  Customer,
  Bill,
  Payment,
  ShopSettings,
  AuditLog
} from '../models/types';
import { generateBillNumber, matchesProductSearch, createPriceHistoryIfChanged } from '../../src/utils/shopLogic';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');

export interface DatabaseState {
  users: User[];
  categories: Category[];
  products: Product[];
  priceHistory: PriceHistory[];
  customers: Customer[];
  bills: Bill[];
  payments: Payment[];
  settings: ShopSettings;
  auditLogs: AuditLog[];
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Sadhukhan Varities',
  adminName: 'Subodh Sadhukhan',
  address: 'Station Road, Barasat, North 24 Parganas, West Bengal 700124',
  mobile: '9830012345',
  upiId: '9830012345@upi',
  upiQrUrl: '',
  logoUrl: ''
};

class Store {
  private data: DatabaseState = {
    users: [],
    categories: [],
    products: [],
    priceHistory: [],
    customers: [],
    bills: [],
    payments: [],
    settings: DEFAULT_SETTINGS,
    auditLogs: []
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.settings) {
          this.data.settings = DEFAULT_SETTINGS;
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing store:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting store:', err);
    }
  }

  // --- Audit Logging ---
  public addAuditLog(
    category: AuditLog['category'],
    action: string,
    details: string,
    performedBy: string,
    performedByName: string
  ): AuditLog {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      category,
      details,
      performedBy,
      performedByName,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs];
  }

  // --- Settings ---
  public getSettings(): ShopSettings {
    return { ...this.data.settings };
  }

  public updateSettings(
    newSettings: Partial<ShopSettings>,
    adminId: string,
    adminName: string
  ): ShopSettings {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.addAuditLog('settings', 'Update Settings', 'Updated shop settings / branding', adminId, adminName);
    this.save();
    return { ...this.data.settings };
  }

  // --- Users ---
  public getUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmailOrMobile(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.email.toLowerCase() === clean || u.mobile.replace(/\D/g, '') === clean.replace(/\D/g, '')
    );
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    const deleted = this.data.users.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return [...this.data.categories];
  }

  public addCategory(
    nameEn: string,
    nameBn: string,
    userId: string,
    userName: string
  ): Category {
    const cat: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      status: 'active',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.categories.push(cat);
    this.addAuditLog('product', 'Add Category', `Created category "${nameEn}" / "${nameBn}"`, userId, userName);
    this.save();
    return cat;
  }

  public updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'nameEn' | 'nameBn' | 'status'>>,
    userId: string,
    userName: string
  ): Category | undefined {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.data.categories[idx] = {
      ...this.data.categories[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.addAuditLog('product', 'Update Category', `Updated category "${this.data.categories[idx].nameEn}"`, userId, userName);
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string, userId: string, userName: string): boolean {
    const cat = this.data.categories.find(c => c.id === id);
    if (!cat) return false;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.addAuditLog('product', 'Delete Category', `Deleted category "${cat.nameEn}"`, userId, userName);
    this.save();
    return true;
  }

  // --- Products ---
  public getProducts(): Product[] {
    // Populate category names
    return this.data.products.map(p => {
      const cat = this.data.categories.find(c => c.id === p.categoryId);
      return {
        ...p,
        categoryNameEn: cat ? cat.nameEn : '',
        categoryNameBn: cat ? cat.nameBn : ''
      };
    });
  }

  public findProductById(id: string): Product | undefined {
    const p = this.data.products.find(prod => prod.id === id);
    if (!p) return undefined;
    const cat = this.data.categories.find(c => c.id === p.categoryId);
    return {
      ...p,
      categoryNameEn: cat ? cat.nameEn : '',
      categoryNameBn: cat ? cat.nameBn : ''
    };
  }

  public quickSearchProducts(query: string): Product[] {
    const all = this.getProducts().filter(p => p.active !== false);
    if (!query || !query.trim()) {
      return all.slice(0, 50);
    }
    return all.filter(p => matchesProductSearch(p, query)).slice(0, 100);
  }

  public addProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    adminId: string,
    adminName: string
  ): Product {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const product: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.products.push(product);

    // Initial price history entry
    const history: PriceHistory = {
      id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: id,
      productNameEn: product.nameEn,
      productNameBn: product.nameBn,
      oldPrice: product.sellingPrice,
      newPrice: product.sellingPrice,
      changedBy: adminName,
      changedAt: now
    };
    this.data.priceHistory.unshift(history);

    this.addAuditLog('product', 'Add Product', `Added product "${product.nameEn}" at ₹${product.sellingPrice}/${product.unit}`, adminId, adminName);
    this.save();
    return product;
  }

  public updateProduct(
    id: string,
    updates: Partial<Product>,
    adminId: string,
    adminName: string
  ): Product | undefined {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    const oldProduct = this.data.products[idx];
    const oldPrice = oldProduct.sellingPrice;
    const newPrice = updates.sellingPrice !== undefined ? updates.sellingPrice : oldPrice;

    // Check if price changed
    const priceChange = createPriceHistoryIfChanged(id, oldPrice, newPrice, adminName);
    if (priceChange) {
      const ph: PriceHistory = {
        id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: id,
        productNameEn: updates.nameEn || oldProduct.nameEn,
        productNameBn: updates.nameBn || oldProduct.nameBn,
        oldPrice,
        newPrice,
        changedBy: adminName,
        changedAt: priceChange.changedAt
      };
      this.data.priceHistory.unshift(ph);
      this.addAuditLog('price', 'Price Change', `Changed price of "${oldProduct.nameEn}": ₹${oldPrice} → ₹${newPrice}`, adminId, adminName);
    }

    this.data.products[idx] = {
      ...oldProduct,
      ...updates,
      updatedBy: adminId,
      updatedAt: new Date().toISOString()
    };

    this.addAuditLog('product', 'Update Product', `Updated product "${this.data.products[idx].nameEn}"`, adminId, adminName);
    this.save();
    return this.data.products[idx];
  }

  public deactivateOrDeleteProduct(id: string, adminId: string, adminName: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;

    // Check if product is in any historical bills
    const hasBills = this.data.bills.some(b => b.items.some(it => it.productId === id));
    const prodName = this.data.products[idx].nameEn;

    if (hasBills) {
      // Soft-delete / deactivate to preserve historical bills integrity
      this.data.products[idx].active = false;
      this.data.products[idx].stockStatus = 'inactive';
      this.data.products[idx].updatedAt = new Date().toISOString();
      this.addAuditLog('product', 'Deactivate Product', `Deactivated product "${prodName}" (retained for bill history)`, adminId, adminName);
    } else {
      // Safe to fully remove
      this.data.products.splice(idx, 1);
      this.addAuditLog('product', 'Delete Product', `Deleted product "${prodName}"`, adminId, adminName);
    }
    this.save();
    return true;
  }

  // --- Price History (Admin Only) ---
  public getPriceHistory(productId?: string): PriceHistory[] {
    if (productId) {
      return this.data.priceHistory.filter(ph => ph.productId === productId);
    }
    return [...this.data.priceHistory];
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return [...this.data.customers];
  }

  public findCustomerByMobile(mobile: string): Customer | undefined {
    const clean = mobile.replace(/\D/g, '');
    return this.data.customers.find(c => c.mobile.replace(/\D/g, '') === clean);
  }

  public addCustomer(name: string, mobile: string, notes?: string): Customer {
    const existing = this.findCustomerByMobile(mobile);
    if (existing) {
      existing.name = name.trim();
      if (notes) existing.notes = notes;
      existing.updatedAt = new Date().toISOString();
      this.save();
      return existing;
    }

    const customer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      mobile: mobile.trim(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.customers.push(customer);
    this.save();
    return customer;
  }

  // --- Bills ---
  public getBills(): Bill[] {
    return [...this.data.bills];
  }

  public findBillById(id: string): Bill | undefined {
    return this.data.bills.find(b => b.id === id);
  }

  public getNextBillNumber(date: Date = new Date()): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const datePrefix = `BILL-${yyyy}${mm}${dd}-`;

    const billsToday = this.data.bills.filter(b => b.billNumber.startsWith(datePrefix));
    let maxSeq = 0;
    for (const b of billsToday) {
      const parts = b.billNumber.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    return generateBillNumber(date, maxSeq + 1);
  }

  public createBill(
    billInput: Omit<Bill, 'id' | 'billNumber' | 'createdAt' | 'updatedAt' | 'shopSnapshot'>,
    userId: string,
    userName: string
  ): Bill {
    const now = new Date();
    const billNumber = this.getNextBillNumber(now);
    const currentSettings = this.getSettings();

    // Preserve snapshot of shop info inside the bill so historical bills remain accurate
    const shopSnapshot: ShopSettings = {
      shopName: currentSettings.shopName,
      adminName: currentSettings.adminName,
      address: currentSettings.address,
      mobile: currentSettings.mobile,
      logoUrl: currentSettings.logoUrl,
      upiQrUrl: currentSettings.upiQrUrl,
      upiId: currentSettings.upiId
    };

    const bill: Bill = {
      ...billInput,
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      billNumber,
      shopSnapshot,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.data.bills.unshift(bill);

    // If customer provided and due amount > 0, ensure customer record
    if (bill.customerName && bill.customerMobile && bill.dueAmount > 0) {
      const cust = this.addCustomer(bill.customerName, bill.customerMobile);
      bill.customerId = cust.id;
    }

    this.addAuditLog('bill', 'Create Bill', `Generated ${bill.billNumber} for total ₹${bill.total} (Paid: ₹${bill.paidAmount}, Due: ₹${bill.dueAmount})`, userId, userName);
    this.save();
    return bill;
  }

  public cancelBill(billId: string, reason: string, adminId: string, adminName: string): Bill | undefined {
    const idx = this.data.bills.findIndex(b => b.id === billId);
    if (idx === -1) return undefined;

    this.data.bills[idx].status = 'cancelled';
    this.data.bills[idx].cancelledAt = new Date().toISOString();
    this.data.bills[idx].cancelledBy = adminId;
    this.data.bills[idx].cancelledByName = adminName;
    this.data.bills[idx].cancellationReason = reason;
    this.data.bills[idx].updatedAt = new Date().toISOString();

    this.addAuditLog('bill', 'Cancel Bill', `Cancelled bill ${this.data.bills[idx].billNumber}. Reason: ${reason}`, adminId, adminName);
    this.save();
    return this.data.bills[idx];
  }

  // --- Due Payments ---
  public getPayments(): Payment[] {
    return [...this.data.payments];
  }

  public getDueRecords(): {
    customerId: string;
    customerName: string;
    customerMobile: string;
    totalBillAmount: number;
    totalPaid: number;
    remainingDue: number;
    billsCount: number;
    lastBillDate: string;
    bills: Bill[];
    payments: Payment[];
  }[] {
    // Group active due records by customer
    const activeBills = this.data.bills.filter(b => b.status !== 'cancelled' && b.customerMobile);
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      customerMobile: string;
      totalBillAmount: number;
      totalPaid: number;
      remainingDue: number;
      billsCount: number;
      lastBillDate: string;
      bills: Bill[];
      payments: Payment[];
    }>();

    for (const b of activeBills) {
      const mobile = b.customerMobile || '';
      if (!mobile) continue;
      if (!customerMap.has(mobile)) {
        customerMap.set(mobile, {
          customerId: b.customerId || mobile,
          customerName: b.customerName || 'Customer',
          customerMobile: mobile,
          totalBillAmount: 0,
          totalPaid: 0,
          remainingDue: 0,
          billsCount: 0,
          lastBillDate: b.billDate,
          bills: [],
          payments: []
        });
      }
      const record = customerMap.get(mobile)!;
      record.totalBillAmount += b.total;
      record.totalPaid += b.paidAmount;
      record.remainingDue += b.dueAmount;
      record.billsCount += 1;
      record.bills.push(b);
      if (new Date(b.billDate) > new Date(record.lastBillDate)) {
        record.lastBillDate = b.billDate;
      }
    }

    // Attach payments
    for (const p of this.data.payments) {
      const rec = customerMap.get(p.customerMobile);
      if (rec) {
        rec.payments.push(p);
        rec.totalPaid += p.amount;
        rec.remainingDue = Math.max(0, rec.remainingDue - p.amount);
      }
    }

    return Array.from(customerMap.values()).map(r => ({
      ...r,
      totalBillAmount: Number(r.totalBillAmount.toFixed(2)),
      totalPaid: Number(r.totalPaid.toFixed(2)),
      remainingDue: Number(r.remainingDue.toFixed(2))
    }));
  }

  public recordPayment(
    paymentInput: Omit<Payment, 'id' | 'createdAt'>,
    userId: string,
    userName: string
  ): Payment {
    const payment: Payment = {
      ...paymentInput,
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    this.data.payments.unshift(payment);

    // If linked to a specific bill, update the bill's paidAmount & dueAmount
    if (payment.billId) {
      const bill = this.data.bills.find(b => b.id === payment.billId);
      if (bill) {
        bill.paidAmount = Number((bill.paidAmount + payment.amount).toFixed(2));
        bill.dueAmount = Math.max(0, Number((bill.total - bill.paidAmount).toFixed(2)));
        bill.updatedAt = new Date().toISOString();
      }
    }

    this.addAuditLog('bill', 'Record Due Payment', `Recorded ₹${payment.amount} payment from ${payment.customerName} (${payment.customerMobile}) via ${payment.paymentMethod}`, userId, userName);
    this.save();
    return payment;
  }
}

export const store = new Store();
