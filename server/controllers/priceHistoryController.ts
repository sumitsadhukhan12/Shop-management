import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';

export function listPriceHistory(req: AuthenticatedRequest, res: Response) {
  // Staff must NEVER see old selling prices or price-change history
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Access forbidden. Only Administrators can view price history.' });
    return;
  }

  const { productId } = req.query;
  const history = store.getPriceHistory(typeof productId === 'string' ? productId : undefined);
  res.json({ history });
}
