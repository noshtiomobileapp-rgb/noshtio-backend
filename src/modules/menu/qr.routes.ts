import { Router } from 'express';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { QRService } from './qr.service';

const router = Router();
const qrService = new QRService();

router.use(requireAuth, requireRole(['vendor_admin']));

// List all QR codes for this vendor
router.get('/', asyncHandler(async (req, res) => {
  const vendorId = req.user!.vendorId!;
  const qrs = await qrService.getVendorQRCodes(vendorId);
  res.json({ success: true, data: qrs });
}));

// Generate a single QR
router.post('/generate', asyncHandler(async (req, res) => {
  const { type, tableIdentifier } = req.body;
  const qr = await qrService.generateQR(req.user!.vendorId!, type, tableIdentifier);
  res.status(201).json({ success: true, data: qr });
}));

// Bulk generate table QRs
router.post('/generate/bulk-tables', asyncHandler(async (req, res) => {
  const { tableCount } = req.body;
  if (!tableCount || tableCount < 1 || tableCount > 50) {
    return res.status(400).json({ success: false, message: 'tableCount must be 1–50' });
  }
  const qrs = await qrService.bulkGenerateTableQRs(req.user!.vendorId!, tableCount);
  res.status(201).json({ success: true, data: qrs });
}));

// Deactivate a QR
router.delete('/:qrId', asyncHandler(async (req, res) => {
  const ok = await qrService.deactivateQR(req.params.qrId, req.user!.vendorId!);
  if (!ok) return res.status(404).json({ success: false, message: 'QR not found' });
  res.json({ success: true });
}));

export default router;