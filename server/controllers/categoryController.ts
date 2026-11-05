import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';

export function listCategories(req: AuthenticatedRequest, res: Response) {
  const categories = store.getCategories();
  res.json({ categories });
}

export function createCategory(req: AuthenticatedRequest, res: Response) {
  const { nameEn, nameBn } = req.body;
  if (!nameEn || !nameBn) {
    res.status(400).json({ message: 'Both English and Bengali category names are required.' });
    return;
  }

  const category = store.addCategory(nameEn, nameBn, req.user!.id, req.user!.name);
  res.status(201).json({ message: 'Category created successfully.', category });
}

export function updateCategory(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { nameEn, nameBn, status } = req.body;

  const category = store.updateCategory(id, { nameEn, nameBn, status }, req.user!.id, req.user!.name);
  if (!category) {
    res.status(404).json({ message: 'Category not found.' });
    return;
  }

  res.json({ message: 'Category updated successfully.', category });
}

export function deleteCategory(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  // Check if any product belongs to this category
  const products = store.getProducts().filter(p => p.categoryId === id);
  if (products.length > 0) {
    res.status(400).json({ message: `Cannot delete category: ${products.length} products belong to it.` });
    return;
  }

  const deleted = store.deleteCategory(id, req.user!.id, req.user!.name);
  if (!deleted) {
    res.status(404).json({ message: 'Category not found.' });
    return;
  }

  res.json({ message: 'Category removed successfully.' });
}
