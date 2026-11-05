import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { filterProductForRole } from '../../src/utils/shopLogic';
import { Product } from '../models/types';
import { uploadImage } from '../config/cloudinary';

export function listProducts(req: AuthenticatedRequest, res: Response) {
  const { search, category, status, sortBy } = req.query;
  const role = req.user?.role || 'staff';

  let products = store.getProducts();

  // Filter active
  if (role === 'staff') {
    products = products.filter(p => p.active !== false);
  }

  // Filter category
  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter(p => p.categoryId === category);
  }

  // Filter status
  if (status && typeof status === 'string' && status !== 'all') {
    products = products.filter(p => p.stockStatus === status);
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim()) {
    products = store.quickSearchProducts(search);
  }

  // Sorting
  if (sortBy === 'price_asc') {
    products.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (sortBy === 'price_desc') {
    products.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (sortBy === 'name') {
    products.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  } else {
    // default recently updated
    products.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // Filter out purchasePrice for staff
  const safeProducts = products.map(p => filterProductForRole(p, role));
  res.json({ products: safeProducts });
}

export function quickSearch(req: AuthenticatedRequest, res: Response) {
  const { q } = req.query;
  const role = req.user?.role || 'staff';
  const queryStr = typeof q === 'string' ? q : '';

  const results = store.quickSearchProducts(queryStr);
  const safeResults = results.map(p => filterProductForRole(p, role));
  res.json({ results: safeResults });
}

export function getProductById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const role = req.user?.role || 'staff';

  const product = store.findProductById(id);
  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  res.json({ product: filterProductForRole(product, role) });
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      nameEn,
      nameBn,
      categoryId,
      purchasePrice,
      sellingPrice,
      unit,
      stockStatus,
      location,
      imageFile
    } = req.body;

    if (!nameEn || !nameBn || !categoryId || sellingPrice === undefined || !unit) {
      res.status(400).json({ message: 'English name, Bengali name, category, selling price and unit are required.' });
      return;
    }

    let imageUrl: string | undefined = undefined;
    let imagePublicId: string | undefined = undefined;

    if (imageFile && typeof imageFile === 'string' && imageFile.startsWith('data:image/')) {
      const uploadRes = await uploadImage(imageFile, 'sadhukhan_varities/products');
      imageUrl = uploadRes.url;
      imagePublicId = uploadRes.publicId;
    }

    const newProd = store.addProduct(
      {
        nameEn: nameEn.trim(),
        nameBn: nameBn.trim(),
        categoryId,
        purchasePrice: purchasePrice !== undefined && purchasePrice !== '' ? Number(purchasePrice) : undefined,
        sellingPrice: Number(sellingPrice),
        unit: unit.trim(),
        stockStatus: stockStatus || 'available',
        location: location ? location.trim() : 'Counter',
        imageUrl,
        imagePublicId,
        active: true,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      },
      req.user!.id,
      req.user!.name
    );

    res.status(201).json({ message: 'Product added successfully.', product: newProd });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product.' });
  }
}

export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      nameEn,
      nameBn,
      categoryId,
      purchasePrice,
      sellingPrice,
      unit,
      stockStatus,
      location,
      imageFile,
      active
    } = req.body;

    const existing = store.findProductById(id);
    if (!existing) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const updates: Partial<Product> = {};
    if (nameEn !== undefined) updates.nameEn = nameEn.trim();
    if (nameBn !== undefined) updates.nameBn = nameBn.trim();
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (purchasePrice !== undefined) updates.purchasePrice = purchasePrice === '' ? undefined : Number(purchasePrice);
    if (sellingPrice !== undefined) updates.sellingPrice = Number(sellingPrice);
    if (unit !== undefined) updates.unit = unit.trim();
    if (stockStatus !== undefined) updates.stockStatus = stockStatus;
    if (location !== undefined) updates.location = location.trim();
    if (active !== undefined) updates.active = Boolean(active);

    if (imageFile && typeof imageFile === 'string' && imageFile.startsWith('data:image/')) {
      const uploadRes = await uploadImage(imageFile, 'sadhukhan_varities/products');
      updates.imageUrl = uploadRes.url;
      updates.imagePublicId = uploadRes.publicId;
    }

    const updated = store.updateProduct(id, updates, req.user!.id, req.user!.name);
    res.json({ message: 'Product updated successfully.', product: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product.' });
  }
}

export function updateStockStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { stockStatus } = req.body;

  if (!stockStatus) {
    res.status(400).json({ message: 'Stock status is required.' });
    return;
  }

  const updated = store.updateProduct(id, { stockStatus }, req.user!.id, req.user!.name);
  if (!updated) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  res.json({ message: 'Stock status updated.', product: updated });
}

export function deleteProduct(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const success = store.deactivateOrDeleteProduct(id, req.user!.id, req.user!.name);
  if (!success) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }
  res.json({ message: 'Product removed or archived safely.' });
}
