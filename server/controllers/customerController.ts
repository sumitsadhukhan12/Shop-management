import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';

export function listCustomers(req: AuthenticatedRequest, res: Response) {
  const { search } = req.query;
  let customers = store.getCustomers();

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    customers = customers.filter(
      c => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
    );
  }

  // Attach aggregated dues to each customer
  const dueRecords = store.getDueRecords();
  const enhanced = customers.map(c => {
    const due = dueRecords.find(d => d.customerMobile.replace(/\D/g, '') === c.mobile.replace(/\D/g, ''));
    return {
      ...c,
      totalDue: due ? due.remainingDue : 0,
      totalPaid: due ? due.totalPaid : 0,
      billsCount: due ? due.billsCount : 0
    };
  });

  res.json({ customers: enhanced });
}

export function getCustomerDetails(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const customers = store.getCustomers();
  const customer = customers.find(c => c.id === id || c.mobile === id);

  if (!customer) {
    res.status(404).json({ message: 'Customer not found.' });
    return;
  }

  const bills = store.getBills().filter(b => b.customerMobile && b.customerMobile.replace(/\D/g, '') === customer.mobile.replace(/\D/g, ''));
  const payments = store.getPayments().filter(p => p.customerMobile.replace(/\D/g, '') === customer.mobile.replace(/\D/g, ''));

  res.json({
    customer,
    bills,
    payments
  });
}
