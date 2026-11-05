import { Response } from 'express';
import * as XLSX from 'xlsx';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';

export function exportExcel(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only Administrators can export Excel backups.' });
    return;
  }

  try {
    const wb = XLSX.utils.book_new();

    // 1. Products Sheet (NO PASSWORDS)
    const products = store.getProducts();
    const productRows = products.map(p => ({
      'Product ID': p.id,
      'Name (English)': p.nameEn,
      'Name (Bengali)': p.nameBn,
      'Category': p.categoryNameEn || '',
      'Purchase Price (₹)': p.purchasePrice !== undefined ? p.purchasePrice : '',
      'Selling Price (₹)': p.sellingPrice,
      'Unit': p.unit,
      'Stock Status': p.stockStatus,
      'Location in Shop': p.location,
      'Active': p.active ? 'Yes' : 'No',
      'Created At': p.createdAt
    }));
    const wsProducts = XLSX.utils.json_to_sheet(productRows);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

    // 2. Categories Sheet
    const categories = store.getCategories();
    const categoryRows = categories.map(c => ({
      'Category ID': c.id,
      'Name (English)': c.nameEn,
      'Name (Bengali)': c.nameBn,
      'Status': c.status,
      'Created At': c.createdAt
    }));
    const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

    // 3. Price History Sheet
    const priceHistory = store.getPriceHistory();
    const priceRows = priceHistory.map(ph => ({
      'Product (English)': ph.productNameEn,
      'Product (Bengali)': ph.productNameBn,
      'Old Price (₹)': ph.oldPrice,
      'New Price (₹)': ph.newPrice,
      'Changed By': ph.changedBy,
      'Changed Date/Time': ph.changedAt
    }));
    const wsPrice = XLSX.utils.json_to_sheet(priceRows);
    XLSX.utils.book_append_sheet(wb, wsPrice, 'Price History');

    // 4. Customers Sheet
    const customers = store.getCustomers();
    const customerRows = customers.map(c => ({
      'Customer ID': c.id,
      'Name': c.name,
      'Mobile': c.mobile,
      'Notes': c.notes || '',
      'Registered At': c.createdAt
    }));
    const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');

    // 5. Bills Sheet
    const bills = store.getBills();
    const billRows = bills.map(b => ({
      'Bill Number': b.billNumber,
      'Date': b.billDate,
      'Customer Name': b.customerName || 'Walk-in',
      'Customer Mobile': b.customerMobile || '',
      'Items Summary': b.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join('; '),
      'Subtotal (₹)': b.subtotal,
      'Grand Total (₹)': b.total,
      'Paid Amount (₹)': b.paidAmount,
      'Due Amount (₹)': b.dueAmount,
      'Payment Method': b.paymentMethod.toUpperCase(),
      'Status': b.status,
      'Created By': b.createdByName
    }));
    const wsBills = XLSX.utils.json_to_sheet(billRows);
    XLSX.utils.book_append_sheet(wb, wsBills, 'Bills');

    // 6. Due Payments Sheet
    const payments = store.getPayments();
    const paymentRows = payments.map(p => ({
      'Payment ID': p.id,
      'Customer Name': p.customerName,
      'Mobile': p.customerMobile,
      'Bill Number': p.billNumber || '',
      'Amount Paid (₹)': p.amount,
      'Method': p.paymentMethod.toUpperCase(),
      'Payment Date': p.paymentDate,
      'Note': p.note || '',
      'Recorded By': p.createdByName
    }));
    const wsPayments = XLSX.utils.json_to_sheet(paymentRows);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Due Payments');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Sadhukhan_Varities_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ message: 'Failed to generate Excel export.' });
  }
}

export function downloadTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    const wb = XLSX.utils.book_new();
    const templateRows = [
      {
        'Name (English)': 'Engine Oil 20W40 (Castrol 1L)',
        'Name (Bengali)': 'ইঞ্জিন তেল ২০ডব্লিউ৪০ (১ লিটার)',
        'Category': 'Oil & Lubricants',
        'Purchase Price (₹)': 390,
        'Selling Price (₹)': 450,
        'Unit': 'Bottle',
        'Stock Status': 'available',
        'Location in Shop': 'Rack 3 / Shelf 2'
      },
      {
        'Name (English)': 'Tata Salt 1kg',
        'Name (Bengali)': 'টাটা লবণ ১ কেজি',
        'Category': 'Spices & Grocery',
        'Purchase Price (₹)': 24,
        'Selling Price (₹)': 28,
        'Unit': 'Packet',
        'Stock Status': 'available',
        'Location in Shop': 'Rack 1 / Shelf 1'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Product Import Template');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Sadhukhan_Varities_Product_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate template.' });
  }
}

export function validateAndImportExcel(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only Administrators can import products.' });
    return;
  }

  try {
    const { base64Data, commit } = req.body;
    if (!base64Data) {
      res.status(400).json({ message: 'No Excel file data received.' });
      return;
    }

    // Strip prefix if present
    const base64Clean = base64Data.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

    if (rows.length === 0) {
      res.status(400).json({ message: 'The uploaded Excel file has no product rows.' });
      return;
    }

    const categories = store.getCategories();
    const existingProducts = store.getProducts();

    const errors: { row: number; item: string; error: string }[] = [];
    const validItems: {
      nameEn: string;
      nameBn: string;
      categoryId: string;
      purchasePrice?: number;
      sellingPrice: number;
      unit: string;
      stockStatus: 'available' | 'limited' | 'out_of_stock' | 'inactive';
      location: string;
    }[] = [];

    const allowedStatuses = ['available', 'limited', 'out_of_stock', 'inactive'];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // 1-indexed header is row 1
      const nameEn = String(row['Name (English)'] || row['nameEn'] || '').trim();
      const nameBn = String(row['Name (Bengali)'] || row['nameBn'] || '').trim();
      const catName = String(row['Category'] || row['category'] || '').trim();
      const purchasePriceRaw = row['Purchase Price (₹)'] || row['purchasePrice'];
      const sellingPriceRaw = row['Selling Price (₹)'] || row['sellingPrice'];
      const unit = String(row['Unit'] || row['unit'] || 'Piece').trim();
      const statusRaw = String(row['Stock Status'] || row['stockStatus'] || 'available').trim().toLowerCase();
      const location = String(row['Location in Shop'] || row['location'] || 'Counter').trim();

      if (!nameEn) {
        errors.push({ row: rowNum, item: 'Row ' + rowNum, error: 'English name is required.' });
        return;
      }
      if (!nameBn) {
        errors.push({ row: rowNum, item: nameEn, error: 'Bengali name is required.' });
        return;
      }

      const sellingPrice = Number(sellingPriceRaw);
      if (isNaN(sellingPrice) || sellingPrice <= 0) {
        errors.push({ row: rowNum, item: nameEn, error: 'Selling price must be a positive number.' });
        return;
      }

      const purchasePrice = purchasePriceRaw !== undefined && purchasePriceRaw !== '' ? Number(purchasePriceRaw) : undefined;
      if (purchasePrice !== undefined && isNaN(purchasePrice)) {
        errors.push({ row: rowNum, item: nameEn, error: 'Purchase price must be a valid number if specified.' });
        return;
      }

      // Check category match or auto-link
      let cat = categories.find(c => c.nameEn.toLowerCase() === catName.toLowerCase() || c.nameBn === catName);
      let catId = cat?.id;

      if (!catId) {
        // If category doesn't exist, create it if committing, or match default
        if (catName) {
          catId = categories[0]?.id; // Default or first
        } else {
          catId = categories[0]?.id;
        }
      }

      const stockStatus = allowedStatuses.includes(statusRaw) ? (statusRaw as any) : 'available';

      // Check duplicate in file or existing
      const isDuplicate = existingProducts.some(p => p.nameEn.toLowerCase() === nameEn.toLowerCase());
      if (isDuplicate && !commit) {
        // Warning or error
      }

      validItems.push({
        nameEn,
        nameBn,
        categoryId: catId,
        purchasePrice,
        sellingPrice,
        unit,
        stockStatus,
        location
      });
    });

    // If commit is requested and errors exist, reject
    if (commit && errors.length > 0) {
      res.status(400).json({
        message: 'Cannot import file with validation errors. Please fix highlighted rows.',
        errors,
        totalRows: rows.length,
        validCount: validItems.length
      });
      return;
    }

    if (commit) {
      let importedCount = 0;
      for (const item of validItems) {
        store.addProduct(
          {
            ...item,
            active: true,
            createdBy: req.user!.id,
            updatedBy: req.user!.id
          },
          req.user!.id,
          req.user!.name
        );
        importedCount += 1;
      }

      store.addAuditLog('product', 'Excel Import', `Imported ${importedCount} products from Excel backup`, req.user!.id, req.user!.name);

      res.json({
        message: `Successfully imported ${importedCount} products into inventory.`,
        importedCount
      });
      return;
    }

    // Preview mode
    res.json({
      message: errors.length === 0 ? 'File is valid and ready for import.' : 'Validation issues detected.',
      totalRows: rows.length,
      validCount: validItems.length,
      errors,
      preview: validItems.slice(0, 10)
    });
  } catch (err) {
    console.error('Import validation failed:', err);
    res.status(500).json({ message: 'Failed to parse Excel file. Ensure valid .xlsx format.' });
  }
}
