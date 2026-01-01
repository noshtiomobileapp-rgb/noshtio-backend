import { Request, Response } from "express";
import * as OrderService from "./order.service";
import { OrderStatus } from "./order.model";

/* ============================================================
   HELPERS (MVP CANONICAL)
============================================================ */

/**
 * Vendor identity is resolved ONLY from auth middleware.
 * tenantId === vendorId (MVP rule)
 */
const getVendorId = (req: Request): string => {
  const vendorId = (req as any).user?.tenantId;
  if (!vendorId) {
    throw new Error("Vendor context missing");
  }
  return vendorId;
};

/* ============================================================
   ALLOWED ORDER STATUSES (CANONICAL)
============================================================ */

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

/* ============================================================
   CREATE ORDER (MVP MINIMAL)
============================================================ */

export const createOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const vendorId = getVendorId(req);
    const { totalAmount } = req.body;

    if (typeof totalAmount !== "number") {
      return res.status(400).json({
        message: "totalAmount is required",
      });
    }

    const order = await OrderService.createOrder({
      vendorId,
      totalAmount,
    });

    return res.status(201).json({ data: order });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message ?? "Failed to create order",
    });
  }
};

/* ============================================================
   GET ORDER (READ-ONLY / POLLING SAFE)
============================================================ */

export const getOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await OrderService.getOrderById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json({ data: order });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message ?? "Failed to fetch order",
    });
  }
};

/* ============================================================
   LIST ORDERS (VENDOR CONTEXT)
============================================================ */

export const listOrdersHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const vendorId = getVendorId(req);
    const status =
      req.query.status as OrderStatus | undefined;

    const orders = await OrderService.listOrders({
      vendorId,
      status,
    });

    return res.json({ data: orders });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message ?? "Failed to list orders",
    });
  }
};

/* ============================================================
   UPDATE ORDER STATUS (STRICT LINEAR FLOW)
============================================================ */

export const updateOrderStatusHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const status = req.body.status as OrderStatus;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await OrderService.updateOrderStatus(
      req.params.id,
      status
    );

    return res.json({ data: order });
  } catch (e: any) {
    return res.status(400).json({
      message:
        e?.message ?? "Failed to update order status",
    });
  }
};

/* ============================================================
   CANCEL ORDER
============================================================ */

export const cancelOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await OrderService.cancelOrder(
      req.params.id
    );
    return res.json({ data: order });
  } catch (e: any) {
    return res.status(400).json({
      message:
        e?.message ?? "Failed to cancel order",
    });
  }
};

/* ============================================================
   VENDOR DASHBOARD — ORDERS SUMMARY
============================================================ */
/**
 * GET /vendor/orders/summary
 * Used by Vendor Dashboard home
 */
export const vendorOrdersSummaryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const vendorId = getVendorId(req);

    const summary =
      await OrderService.getVendorOrdersSummary(
        vendorId
      );

    return res.json(summary);
  } catch (err) {
    console.error(
      "vendorOrdersSummaryHandler error:",
      err
    );
    return res.status(500).json({
      message: "Failed to load orders summary",
    });
  }
};
