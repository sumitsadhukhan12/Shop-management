import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadImage } from '../config/cloudinary';

export function listDueRecords(req: AuthenticatedRequest, res: Response) {
  const { search } = req.query;
  let records = store.getDueRecords();

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    records = records.filter(
      r =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerMobile.includes(q)
    );
  }

  res.json({ dueRecords: records });
}

export async function recordDuePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      customerId,
      customerName,
      customerMobile,
      billId,
      billNumber,
      amount,
      paymentMethod,
      proofImages,
      note
    } = req.body;

    if (!customerMobile || !amount || Number(amount) <= 0) {
      res.status(400).json({ message: 'Customer mobile number and a valid payment amount are required.' });
      return;
    }

    const cleanAmount = Number(amount);

    // Process proof images if provided (base64 data URIs)
    const processedProofUrls: string[] = [];
    if (proofImages && Array.isArray(proofImages)) {
      for (const img of proofImages) {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          const uploaded = await uploadImage(img, 'sadhukhan_varities/due_proofs');
          processedProofUrls.push(uploaded.url);
        } else if (typeof img === 'string' && img.startsWith('http')) {
          processedProofUrls.push(img);
        }
      }
    }

    const payment = store.recordPayment(
      {
        customerId: customerId || customerMobile,
        customerName: customerName || 'Customer',
        customerMobile: customerMobile.trim(),
        billId,
        billNumber,
        amount: cleanAmount,
        paymentMethod: paymentMethod === 'upi' ? 'upi' : 'cash',
        paymentDate: new Date().toISOString(),
        proofImages: processedProofUrls,
        note: note ? note.trim() : undefined,
        createdBy: req.user!.id,
        createdByName: req.user!.name
      },
      req.user!.id,
      req.user!.name
    );

    res.status(201).json({
      message: `Due payment of ₹${cleanAmount} recorded successfully.`,
      payment
    });
  } catch (err) {
    console.error('Failed to record payment:', err);
    res.status(500).json({ message: 'Failed to record payment.' });
  }
}

export function listPayments(req: AuthenticatedRequest, res: Response) {
  const { customerMobile } = req.query;
  let payments = store.getPayments();

  if (customerMobile && typeof customerMobile === 'string') {
    const clean = customerMobile.replace(/\D/g, '');
    payments = payments.filter(p => p.customerMobile.replace(/\D/g, '') === clean);
  }

  res.json({ payments });
}
