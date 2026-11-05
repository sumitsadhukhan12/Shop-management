import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateBillTotals } from '../../src/utils/shopLogic';

export function listBills(req: AuthenticatedRequest, res: Response) {
  const { search, date, status } = req.query;

  let bills = store.getBills();

  if (status && typeof status === 'string' && status !== 'all') {
    bills = bills.filter(b => b.status === status);
  }

  if (date && typeof date === 'string') {
    // Match date string YYYY-MM-DD
    bills = bills.filter(b => b.billDate.startsWith(date));
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    bills = bills.filter(
      b =>
        b.billNumber.toLowerCase().includes(q) ||
        (b.customerName && b.customerName.toLowerCase().includes(q)) ||
        (b.customerMobile && b.customerMobile.includes(q))
    );
  }

  // Sort descending by creation date
  bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ bills });
}

export function getBillById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const bill = store.findBillById(id);
  if (!bill) {
    res.status(404).json({ message: 'Bill not found.' });
    return;
  }
  res.json({ bill });
}

export function createBill(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      items,
      paymentMethod,
      paidAmount,
      customerName,
      customerMobile
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Please add at least one product item to create a bill.' });
      return;
    }

    // Validate and calculate totals
    const calculation = calculateBillTotals(items, paidAmount !== undefined ? Number(paidAmount) : 0);

    // If there is an outstanding due amount, customer name and mobile are strictly required
    if (calculation.dueAmount > 0) {
      if (!customerName || !customerMobile || !customerMobile.trim()) {
        res.status(400).json({
          message: 'Customer name and mobile number are required when there is a pending due amount.'
        });
        return;
      }
    }

    const bill = store.createBill(
      {
        billDate: new Date().toISOString(),
        createdBy: req.user!.id,
        createdByName: req.user!.name,
        customerName: customerName ? customerName.trim() : undefined,
        customerMobile: customerMobile ? customerMobile.trim() : undefined,
        items: calculation.items,
        subtotal: calculation.subtotal,
        total: calculation.total,
        paymentMethod: paymentMethod === 'upi' ? 'upi' : 'cash',
        paidAmount: calculation.paidAmount,
        dueAmount: calculation.dueAmount,
        status: 'completed'
      },
      req.user!.id,
      req.user!.name
    );

    res.status(201).json({
      message: 'Bill generated successfully.',
      bill
    });
  } catch (err) {
    console.error('Bill creation failed:', err);
    res.status(500).json({ message: 'Failed to generate bill.' });
  }
}

export function cancelBill(req: AuthenticatedRequest, res: Response) {
  // Only Admin can cancel an incorrect bill
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only Administrators have permission to cancel bills.' });
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400).json({ message: 'Cancellation reason is required for audit records.' });
    return;
  }

  const bill = store.findBillById(id);
  if (!bill) {
    res.status(404).json({ message: 'Bill not found.' });
    return;
  }

  if (bill.status === 'cancelled') {
    res.status(400).json({ message: 'This bill has already been cancelled.' });
    return;
  }

  const cancelled = store.cancelBill(id, reason.trim(), req.user.id, req.user.name);
  res.json({
    message: `Bill ${cancelled?.billNumber} cancelled successfully.`,
    bill: cancelled
  });
}
