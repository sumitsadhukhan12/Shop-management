import bcrypt from 'bcryptjs';
import { store } from './store';
import { User, Category, Product } from '../models/types';

export async function seedInitialData() {
  const users = store.getUsers();
  if (users.length === 0) {
    console.log('Seeding initial users for Sadhukhan Varities...');

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const staffPasswordHash = await bcrypt.hash('Staff@123', salt);

    // Primary Admin: Subodh Sadhukhan
    const adminUser: User = {
      id: 'user_admin_subodh',
      name: 'Subodh Sadhukhan',
      email: 'admin@sadhukhan.com',
      mobile: '9830012345',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z'
    };
    store.addUser(adminUser);

    // Development/Test Account: Test Staff
    const staffUser: User = {
      id: 'user_staff_test',
      name: 'Test Staff',
      email: 'staff@sadhukhan.com',
      mobile: '9876543210',
      passwordHash: staffPasswordHash,
      role: 'staff',
      status: 'active',
      createdAt: '2026-10-05T09:00:00.000Z',
      updatedAt: '2026-10-05T09:00:00.000Z'
    };
    store.addUser(staffUser);
  }

  // Seed categories if empty
  let categories = store.getCategories();
  if (categories.length === 0) {
    console.log('Seeding initial categories...');
    const defaultCats = [
      { nameEn: 'Oil & Lubricants', nameBn: 'তেল ও লুব্রিকেন্ট' },
      { nameEn: 'Spices & Grocery', nameBn: 'মশলা ও মুদি' },
      { nameEn: 'Toiletries & Personal Care', nameBn: 'প্রসাধন ও যত্ন' },
      { nameEn: 'Stationery & Writing', nameBn: 'খাতা ও স্টেশনারি' },
      { nameEn: 'Snacks & Beverages', nameBn: 'চা ও পানীয়' },
      { nameEn: 'Household & Cleaning', nameBn: 'ঘরোয়া ও পরিষ্কারক' }
    ];

    for (const c of defaultCats) {
      store.addCategory(c.nameEn, c.nameBn, 'user_admin_subodh', 'Subodh Sadhukhan');
    }
    categories = store.getCategories();
  }

  // Seed products if empty
  const products = store.getProducts();
  if (products.length === 0) {
    console.log('Seeding initial products for Sadhukhan Varities...');
    const catOil = categories.find(c => c.nameEn.includes('Oil'))?.id || categories[0].id;
    const catGroc = categories.find(c => c.nameEn.includes('Grocery'))?.id || categories[1].id;
    const catToil = categories.find(c => c.nameEn.includes('Toiletries'))?.id || categories[2].id;
    const catStat = categories.find(c => c.nameEn.includes('Stationery'))?.id || categories[3].id;
    const catSnack = categories.find(c => c.nameEn.includes('Snacks'))?.id || categories[4].id;
    const catHouse = categories.find(c => c.nameEn.includes('Household'))?.id || categories[5].id;

    const initialProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        nameEn: 'Engine Oil 20W40 (Castrol Activ 1L)',
        nameBn: 'ইঞ্জিন তেল ২০ডব্লিউ৪০ (ক্যাস্ট্রল ১ লিটার)',
        categoryId: catOil,
        purchasePrice: 390,
        sellingPrice: 450,
        unit: 'Bottle',
        stockStatus: 'available',
        location: 'Rack 3 / Shelf 2',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Engine Cleaner Spray (500ml)',
        nameBn: 'ইঞ্জিন ক্লিনার স্প্রে (৫০০ মি.লি.)',
        categoryId: catOil,
        purchasePrice: 175,
        sellingPrice: 220,
        unit: 'Bottle',
        stockStatus: 'available',
        location: 'Rack 3 / Shelf 1',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Engine Air Filter (Universal)',
        nameBn: 'ইঞ্জিন এয়ার ফিল্টার (ইউনিভার্সাল)',
        categoryId: catOil,
        purchasePrice: 130,
        sellingPrice: 180,
        unit: 'Piece',
        stockStatus: 'limited',
        location: 'Rack 2 / Shelf 4',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Mustard Oil (Engine Brand 1L)',
        nameBn: 'সরিষার তেল (ইঞ্জিন মার্কা ১ লিটার)',
        categoryId: catGroc,
        purchasePrice: 145,
        sellingPrice: 165,
        unit: 'Litre',
        stockStatus: 'available',
        location: 'Shelf A1 / Row 2',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Tata Salt (Iodized 1kg)',
        nameBn: 'টাটা লবণ (১ কেজি)',
        categoryId: catGroc,
        purchasePrice: 24,
        sellingPrice: 28,
        unit: 'Packet',
        stockStatus: 'available',
        location: 'Rack 1 / Shelf 1',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Dettol Soap 125g',
        nameBn: 'ডেটোল সাবান ১২৫ গ্রাম',
        categoryId: catToil,
        purchasePrice: 38,
        sellingPrice: 45,
        unit: 'Piece',
        stockStatus: 'available',
        location: 'Counter Display',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Classmate Long Exercise Notebook (120 Pages)',
        nameBn: 'ক্লাসমেট লম্বা খাতা (১২০ পাতা)',
        categoryId: catStat,
        purchasePrice: 42,
        sellingPrice: 55,
        unit: 'Piece',
        stockStatus: 'available',
        location: 'Shelf 4 / Left',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Wheel 2in1 Detergent Powder 500g',
        nameBn: 'হুইল গুঁড়ো সাবান ৫০০ গ্রাম',
        categoryId: catHouse,
        purchasePrice: 32,
        sellingPrice: 38,
        unit: 'Packet',
        stockStatus: 'available',
        location: 'Rack 1 / Bottom',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Parachute Pure Coconut Hair Oil 200ml',
        nameBn: 'প্যারাস্যুট খাঁটি নারকেল তেল ২০০ মি.লি.',
        categoryId: catToil,
        purchasePrice: 82,
        sellingPrice: 95,
        unit: 'Bottle',
        stockStatus: 'available',
        location: 'Shelf 2 / Top',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Brooke Bond Red Label Tea 250g',
        nameBn: 'রেড লেবেল চা ২৫০ গ্রাম',
        categoryId: catSnack,
        purchasePrice: 115,
        sellingPrice: 130,
        unit: 'Packet',
        stockStatus: 'limited',
        location: 'Counter Shelf',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Bic Cello Butterflow Ball Pen (Blue)',
        nameBn: 'সেলো বাটারফ্লো বল পেন (নীল)',
        categoryId: catStat,
        purchasePrice: 7.5,
        sellingPrice: 10,
        unit: 'Piece',
        stockStatus: 'available',
        location: 'Counter Pen Stand',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      },
      {
        nameEn: 'Vim Dishwash Bar 300g',
        nameBn: 'ভিম বাসন মাজার সাবান ৩০০ গ্রাম',
        categoryId: catHouse,
        purchasePrice: 26,
        sellingPrice: 32,
        unit: 'Piece',
        stockStatus: 'out_of_stock',
        location: 'Rack 1 / Middle',
        active: true,
        createdBy: 'user_admin_subodh',
        updatedBy: 'user_admin_subodh'
      }
    ];

    for (const p of initialProducts) {
      store.addProduct(p, 'user_admin_subodh', 'Subodh Sadhukhan');
    }

    // Add sample realistic price change history for Engine Oil (e.g. ₹400 -> ₹420 -> ₹450)
    const engineOil = store.getProducts().find(p => p.nameEn.includes('Engine Oil'));
    if (engineOil) {
      store.updateProduct(engineOil.id, { sellingPrice: 420 }, 'user_admin_subodh', 'Subodh Sadhukhan');
      store.updateProduct(engineOil.id, { sellingPrice: 450 }, 'user_admin_subodh', 'Subodh Sadhukhan');
    }

    // Seed sample bills and customer dues
    const sampleCustomer = store.addCustomer('Bikash Ghosh', '9831122334', 'Regular customer from Station Para');
    
    // Bill 1: Paid full
    store.createBill({
      billDate: '2026-11-04T10:30:00.000Z',
      createdBy: 'user_staff_test',
      createdByName: 'Test Staff',
      customerName: 'Ashok Mondal',
      customerMobile: '9748011223',
      items: [
        { productId: engineOil ? engineOil.id : 'p1', productName: 'Engine Oil 20W40 (Castrol Activ 1L)', quantity: 2, unit: 'Bottle', unitPrice: 450, amount: 900 },
        { productId: 'p_dettol', productName: 'Dettol Soap 125g', quantity: 3, unit: 'Piece', unitPrice: 45, amount: 135 }
      ],
      subtotal: 1035,
      total: 1035,
      paymentMethod: 'cash',
      paidAmount: 1035,
      dueAmount: 0,
      status: 'completed'
    }, 'user_staff_test', 'Test Staff');

    // Bill 2: Due customer (Total ₹1500, Paid ₹1000, Due ₹500)
    store.createBill({
      billDate: '2026-11-05T09:15:00.000Z',
      createdBy: 'user_admin_subodh',
      createdByName: 'Subodh Sadhukhan',
      customerId: sampleCustomer.id,
      customerName: sampleCustomer.name,
      customerMobile: sampleCustomer.mobile,
      items: [
        { productId: engineOil ? engineOil.id : 'p1', productName: 'Engine Oil 20W40 (Castrol Activ 1L)', quantity: 3, unit: 'Bottle', unitPrice: 450, amount: 1350 },
        { productId: 'p_salt', productName: 'Tata Salt (Iodized 1kg)', quantity: 5, unit: 'Packet', unitPrice: 28, amount: 140 },
        { productId: 'p_pen', productName: 'Bic Cello Butterflow Ball Pen (Blue)', quantity: 1, unit: 'Piece', unitPrice: 10, amount: 10 }
      ],
      subtotal: 1500,
      total: 1500,
      paymentMethod: 'cash',
      paidAmount: 1000,
      dueAmount: 500,
      status: 'completed'
    }, 'user_admin_subodh', 'Subodh Sadhukhan');
  }
}
