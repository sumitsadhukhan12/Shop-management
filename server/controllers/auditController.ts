import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';

export function listAuditLogs(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only Administrators can access system audit logs.' });
    return;
  }

  const logs = store.getAuditLogs();
  res.json({ logs });
}
