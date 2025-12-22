import { Request, Response } from "express";
import { OrderModel, OrderStatus } from "./order.model";

/**
 * Allowed linear transitions for MVP kitchen flow
 * This is the single source of truth
 */
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * GET /api/kitchen/orders
 * List orders visible to the kitchen
 */
export const listKitchenOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const tenantId = (req as any).tenantId;
    const status = req.query.status as OrderStatus | undefined;

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context missing" });
    }

    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    const orders = await OrderModel.find(query)
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ data: orders });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to fetch kitchen orders" });
  }
};

/**
 * PATCH /api/kitchen/orders/:id/status
 * Explicit kitchen status transition
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
    const tenantId = (req as any).tenantId;

    if (!tenantId) {
      return res.status(400).json({ message: "Tenant context missing" });
    }

    if (!nextStatus) {
      return res.status(400).json({ message: "Status is required" });
    }

    const order = await OrderModel.findOne({ _id: id, tenantId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowedNext = STATUS_FLOW[order.status];

    if (!allowedNext.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid status transition ${order.status} → ${nextStatus}`,
      });
    }

    // Apply status
    order.status = nextStatus;

    // Set timestamps (only those that exist)
    const now = new Date();
    if (nextStatus === "PREPARING") order.preparingAt = now;
    if (nextStatus === "READY") order.readyAt = now;
    if (nextStatus === "COMPLETED") order.completedAt = now;

    await order.save();

    return res.json({ data: order });
  } catch (err: any) {
    return res
      .status(400)
      .json({ message: err?.message ?? "Failed to update order status" });
  }
};
