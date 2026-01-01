import { Request, Response } from "express";
import { OrderModel, OrderStatus } from "./order.model";

/* ============================================================
   STATUS FLOW — SINGLE SOURCE OF TRUTH (MVP)
============================================================ */

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/* ============================================================
   LIST KITCHEN ORDERS
============================================================ */

/**
 * GET /api/kitchen/orders
 * Read-only list for kitchen screen
 */
export const listKitchenOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const status = req.query.status as OrderStatus | undefined;

    if (!tenantId) {
      return res.status(400).json({
        message: "Tenant context missing",
      });
    }

    const query: Record<string, any> = {
      vendorId: tenantId,
    };

    if (status) {
      query.status = status;
    }

    const orders = await OrderModel.find(query)
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ data: orders });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message ?? "Failed to fetch kitchen orders",
    });
  }
};

/* ============================================================
   UPDATE KITCHEN ORDER STATUS
============================================================ */

/**
 * PATCH /api/kitchen/orders/:id/status
 * Strict linear status transition
 */
export const updateKitchenOrderStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body as {
      status?: OrderStatus;
    };

    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        message: "Tenant context missing",
      });
    }

    if (!nextStatus) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const order = await OrderModel.findOne({
      _id: id,
      vendorId: tenantId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const allowedNext =
      STATUS_FLOW[order.status as OrderStatus];

    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status transition ${order.status} → ${nextStatus}`,
      });
    }

    order.status = nextStatus;
    await order.save();

    return res.json({ data: order });
  } catch (err: any) {
    return res.status(500).json({
      message:
        err?.message ?? "Failed to update order status",
    });
  }
};
