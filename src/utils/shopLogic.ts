export interface ProductItem {
  id: string;
  nameEn: string;
  nameBn: string;
  categoryId: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
  purchasePrice?: number;
  sellingPrice: number;
  unit: string;
  stockStatus: 'available' | 'limited' | 'out_of_stock' | 'inactive';
  location: string;
  imageUrl?: string;
  active: boolean;
}

export interface BillCalculationItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

/**
 * Calculates item total and grand total for a bill without discounts
 */
export function calculateBillTotals(items: BillCalculationItem[], paidAmount: number = 0) {
  const calculatedItems = items.map(item => {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.unitPrice);
    const amount = Number((qty * price).toFixed(2));
    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      amount
    };
  });

  const subtotal = Number(calculatedItems.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2));
  const total = subtotal; // No discount system in Sadhukhan Varities V1
  const cleanPaid = Math.max(0, Number(paidAmount || 0));
  const dueAmount = Number(Math.max(0, total - cleanPaid).toFixed(2));

  return {
    items: calculatedItems,
    subtotal,
    total,
    paidAmount: cleanPaid,
    dueAmount
  };
}

/**
 * Generates unique date-based bill number format: BILL-YYYYMMDD-001
 * Resets sequence per day.
 */
export function generateBillNumber(date: Date, sequenceForDate: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seqStr = String(sequenceForDate).padStart(3, '0');
  return `BILL-${yyyy}${mm}${dd}-${seqStr}`;
}

/**
 * Normalizes text for robust instant bilingual search (English + Bengali)
 */
export function normalizeSearchString(str: string): string {
  return (str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if a product matches a search query across English name, Bengali name, or Category name
 */
export function matchesProductSearch(product: ProductItem, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = normalizeSearchString(query);
  const nameEn = normalizeSearchString(product.nameEn);
  const nameBn = normalizeSearchString(product.nameBn);
  const catEn = normalizeSearchString(product.categoryNameEn || '');
  const catBn = normalizeSearchString(product.categoryNameBn || '');
  const loc = normalizeSearchString(product.location || '');

  return (
    nameEn.includes(q) ||
    nameBn.includes(q) ||
    catEn.includes(q) ||
    catBn.includes(q) ||
    loc.includes(q)
  );
}

/**
 * Strips sensitive data for Staff role:
 * Staff must NEVER see old selling prices, purchase price, or price-change history.
 */
export function filterProductForRole(product: ProductItem, role: 'admin' | 'staff'): Partial<ProductItem> {
  if (role === 'admin') {
    return { ...product };
  }
  const { purchasePrice, ...staffSafeProduct } = product;
  return staffSafeProduct;
}

/**
 * Checks if price changed and creates price history entry
 */
export function createPriceHistoryIfChanged(
  productId: string,
  oldPrice: number,
  newPrice: number,
  changedBy: string,
  date: Date = new Date()
) {
  if (oldPrice !== newPrice) {
    return {
      productId,
      oldPrice,
      newPrice,
      changedBy,
      changedAt: date.toISOString()
    };
  }
  return null;
}
