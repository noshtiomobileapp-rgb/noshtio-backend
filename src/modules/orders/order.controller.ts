import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  validateAndCreate,
  getOrderById,
  listOrders,
  updateStatus,
  cancelOrder,
  getVendorOrdersSummary,
} from './order.service';

/* ============================================================
   CREATE ORDER HANDLER
   POST /api/orders/
   - Guest or logged-in customers can place orders
   - Validates items exist + recalculates price
============================================================ */

export const createOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { vendorId, items, totalAmount, tableId, specialNote } = req.body;

    // Validate input
    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'vendorId and items array required',
      });
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'totalAmount must be a positive number',
      });
    }

    const customerId = (req as any).user?.id ?? null;

    const order = await validateAndCreate({
      vendorId,
      customerId,
      items,
      totalAmount,
      tableId,
      specialNote,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  }
);

/* ============================================================
   GET ORDER HANDLER
   GET /api/orders/:id
   - Guest or logged-in can view order status
============================================================ */

export const getOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID required',
      });
    }

    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  }
);

/* ============================================================
   LIST ORDERS HANDLER
   GET /api/orders/
   - Logged-in only: customers see their orders
   - Staff/Admin: filter by vendor (not implemented yet)
============================================================ */

export const listOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const orders = await listOrders({
      customerId: userId,
    });

    res.json({
      success: true,
      data: orders,
    });
  }
);

/* ============================================================
   UPDATE ORDER STATUS HANDLER
   PATCH /api/orders/:id/status
   - Staff/Admin only for now
   - Validates status transition
============================================================ */

export const updateOrderStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID required',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status required',
      });
    }

    const order = await updateStatus(id, status);

    res.json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  }
);

/* ============================================================
   CANCEL ORDER HANDLER
   POST /api/orders/:id/cancel
   - Logged-in customers can cancel NEW orders
============================================================ */

export const cancelOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID required',
      });
    }

    const order = await cancelOrder(id);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  }
);

/* ============================================================
   VENDOR ORDERS SUMMARY HANDLER
   GET /api/vendor/orders/summary
   - Vendor dashboard: daily orders, revenue, pending count
============================================================ */

export const vendorOrdersSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const vendorId = (req as any).user?.vendorId;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: 'Vendor context required',
      });
    }

    const summary = await getVendorOrdersSummary(vendorId);

    res.json({
      success: true,
      data: summary,
    });
  }
);

