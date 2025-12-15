// src/modules/orders/order.controller.ts
import { Request, Response } from "express";
import * as OrderService from "./order.service";

/**
 * Helper to safely read custom request props (user, tenantId) without requiring
 * global type augmentation. Casts to `any` locally to keep file-level safety.
 */
const getUserIdFromReq = (req: Request) => {
  return (req as any).user?._id ?? null;
};
const getTenantIdFromReq = (req: Request) => {
  return (req as any).tenantId ?? null;
};

// ---------------------- CREATE ORDER ----------------------
export const createOrderHandler = async (req: Request, res: Response) => {
  try {
    const order = await (OrderService as any).createOrder({
      userId: getUserIdFromReq(req),
      tenantId: getTenantIdFromReq(req),
      tableId: req.body.tableId,
      items: req.body.items,
      instructions: req.body.instructions,
      payment: req.body.payment,
    });

    return res.status(201).json({ data: order });
  } catch (err: any) {
    // Log if you have a logger: logger.error(err)
    return res.status(400).json({ message: err?.message ?? "Failed to create order" });
  }
};

// ---------------------- GET ORDER BY ID ----------------------
export const getOrderHandler = async (req: Request, res: Response) => {
  try {
    const order = await (OrderService as any).getOrderById(
      req.params.id,
      getTenantIdFromReq(req) ?? ""
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ data: order });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? "Failed to fetch order" });
  }
};

// ---------------------- LIST ORDERS ----------------------
export const listOrdersHandler = async (req: Request, res: Response) => {
  try {
    const orders = await (OrderService as any).listOrders({
      tenantId: getTenantIdFromReq(req) ?? "",
      userId: (req.query.userId as string) ?? undefined,
      status: (req.query.status as string) ?? undefined,
      // Consider adding pagination: page, limit, sort, etc.
    });

    return res.json({ data: orders });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? "Failed to list orders" });
  }
};

// ---------------------- UPDATE ORDER STATUS ----------------------
export const updateOrderStatusHandler = async (req: Request, res: Response) => {
  try {
    const updated = await (OrderService as any).updateOrderStatus(
      req.params.id,
      req.body.status,
      getTenantIdFromReq(req) ?? ""
    );

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? "Failed to update order status" });
  }
};

// ---------------------- CANCEL ORDER ----------------------
export const cancelOrderHandler = async (req: Request, res: Response) => {
  try {
    const updated = await (OrderService as any).cancelOrder(
      req.params.id,
      getUserIdFromReq(req),
      getTenantIdFromReq(req) ?? ""
    );

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? "Failed to cancel order" });
  }
};
