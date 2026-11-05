import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBillTotals,
  generateBillNumber,
  matchesProductSearch,
  filterProductForRole,
  createPriceHistoryIfChanged,
  ProductItem
} from './shopLogic';

test('calculateBillTotals calculates items, subtotal, total, and dues accurately without discount', () => {
  const items = [
    { productId: 'p1', productName: 'Engine Oil', quantity: 2, unit: 'Bottle', unitPrice: 450 },
    { productId: 'p2', productName: 'Soap', quantity: 3, unit: 'Piece', unitPrice: 40 },
    { productId: 'p3', productName: 'Notebook', quantity: 2, unit: 'Piece', unitPrice: 50 },
  ];

  // Total should be 2*450 (900) + 3*40 (120) + 2*50 (100) = 1120
  const resultPaidFull = calculateBillTotals(items, 1120);
  assert.equal(resultPaidFull.subtotal, 1120);
  assert.equal(resultPaidFull.total, 1120);
  assert.equal(resultPaidFull.dueAmount, 0);

  // Partial payment: paid 1000, due should be 120
  const resultPartial = calculateBillTotals(items, 1000);
  assert.equal(resultPartial.paidAmount, 1000);
  assert.equal(resultPartial.dueAmount, 120);
});

test('generateBillNumber outputs format BILL-YYYYMMDD-001', () => {
  const date = new Date(2026, 9, 29); // Month is 0-indexed: 9 = October
  const billNum = generateBillNumber(date, 1);
  assert.equal(billNum, 'BILL-20261029-001');

  const billNum2 = generateBillNumber(date, 15);
  assert.equal(billNum2, 'BILL-20261029-015');
});

test('matchesProductSearch performs bilingual English and Bengali search matching', () => {
  const product: ProductItem = {
    id: 'p1',
    nameEn: 'Engine Oil',
    nameBn: 'ইঞ্জিন তেল',
    categoryId: 'c1',
    categoryNameEn: 'Oil',
    categoryNameBn: 'তেল',
    sellingPrice: 450,
    unit: 'Bottle',
    stockStatus: 'available',
    location: 'Rack 3 / Shelf 2',
    active: true
  };

  // English prefix search "eng"
  assert.equal(matchesProductSearch(product, 'eng'), true);
  // Case insensitive
  assert.equal(matchesProductSearch(product, 'ENGINE'), true);
  // Bengali search
  assert.equal(matchesProductSearch(product, 'ইঞ্জিন'), true);
  // Bengali substring
  assert.equal(matchesProductSearch(product, 'তেল'), true);
  // Category search
  assert.equal(matchesProductSearch(product, 'Oil'), true);
  // Location search
  assert.equal(matchesProductSearch(product, 'Rack 3'), true);
  // Negative test
  assert.equal(matchesProductSearch(product, 'Chocolate'), false);
});

test('filterProductForRole hides purchase price for staff but allows for admin', () => {
  const product: ProductItem = {
    id: 'p1',
    nameEn: 'Engine Oil',
    nameBn: 'ইঞ্জিন তেল',
    categoryId: 'c1',
    purchasePrice: 380,
    sellingPrice: 450,
    unit: 'Bottle',
    stockStatus: 'available',
    location: 'Rack 3 / Shelf 2',
    active: true
  };

  const adminView = filterProductForRole(product, 'admin');
  assert.equal(adminView.purchasePrice, 380);

  const staffView = filterProductForRole(product, 'staff');
  assert.equal(staffView.purchasePrice, undefined);
  assert.equal(staffView.sellingPrice, 450);
});

test('createPriceHistoryIfChanged records price history accurately', () => {
  const history = createPriceHistoryIfChanged('p1', 400, 420, 'Subodh Sadhukhan');
  assert.notEqual(history, null);
  assert.equal(history?.oldPrice, 400);
  assert.equal(history?.newPrice, 420);
  assert.equal(history?.changedBy, 'Subodh Sadhukhan');

  const unchanged = createPriceHistoryIfChanged('p1', 420, 420, 'Subodh Sadhukhan');
  assert.equal(unchanged, null);
});
