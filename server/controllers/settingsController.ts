import { Response } from 'express';
import { store } from '../services/store';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadImage } from '../config/cloudinary';

export function getSettings(req: AuthenticatedRequest, res: Response) {
  const settings = store.getSettings();
  res.json({ settings });
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Only Administrators can modify shop settings.' });
    return;
  }

  try {
    const { shopName, adminName, address, mobile, upiId, logoImage, upiQrImage } = req.body;
    const updates: Record<string, string> = {};

    if (shopName) updates.shopName = shopName.trim();
    if (adminName) updates.adminName = adminName.trim();
    if (address) updates.address = address.trim();
    if (mobile) updates.mobile = mobile.trim();
    if (upiId) updates.upiId = upiId.trim();

    if (logoImage && typeof logoImage === 'string' && logoImage.startsWith('data:image/')) {
      const uploadRes = await uploadImage(logoImage, 'sadhukhan_varities/branding');
      updates.logoUrl = uploadRes.url;
      updates.logoPublicId = uploadRes.publicId;
    }

    if (upiQrImage && typeof upiQrImage === 'string' && upiQrImage.startsWith('data:image/')) {
      const uploadRes = await uploadImage(upiQrImage, 'sadhukhan_varities/branding');
      updates.upiQrUrl = uploadRes.url;
      updates.upiQrPublicId = uploadRes.publicId;
    }

    const updated = store.updateSettings(updates, req.user.id, req.user.name);
    res.json({ message: 'Shop settings updated successfully.', settings: updated });
  } catch (err) {
    console.error('Failed to update settings:', err);
    res.status(500).json({ message: 'Failed to update shop settings.' });
  }
}
