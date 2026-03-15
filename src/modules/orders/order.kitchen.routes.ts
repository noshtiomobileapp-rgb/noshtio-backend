import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireAuth, requireRole } from '@/middleware/auth.middleware';
import Order from './order.model';

const router = Router();

const ACTIVE_STATUSES = ['accepted', 'in_kitchen', 'preparing', 'ready'];

/* ============================================================
   GET ACTIVE KITCHEN ORDERS
   GET /api/vendor/kitchen
   - Kitchen staff can view active orders in FIFO
============================================================ */

router.get(
  '/',
  requireAuth,
  requireRole(['vendor_admin', 'kitchen_staff']),
  asyncHandler(async (req: Request, res: Response) => {
    const vendorId = (req as any).user?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Vendor context required',
      });
    }

    const orders = await Order.find({
      vendorId,
      status: { $in: ACTIVE_STATUSES },
    })
      .sort({ createdAt: 1 }) // oldest first — FIFO
      .select('orderNumber tableId items status specialNote createdAt')
      .lean();

    res.json({ success: true, data: orders });
  })
);

/* ============================================================
   UPDATE ORDER STATUS (KITCHEN WORKFLOW)
   PATCH /api/vendor/kitchen/:orderId
   - Kitchen staff advance order status
============================================================ */

router.patch(
  '/:orderId',
  requireAuth,
  requireRole(['vendor_admin', 'kitchen_staff']),
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status required',
      });
    }

    const allowed: string[] = ['in_kitchen', 'preparing', 'ready'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition',
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({ success: true, data: order });
  })
);

export default router;
