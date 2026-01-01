import { Request, Response } from "express";
import mongoose from "mongoose";
import { OrderModel, OrderStatus } from "../modules/orders/order.model";

/* ============================================================
   TYPES
============================================================ */

/**
 * Shape of lean Order document used by vendor listing (MVP)
 */
type LeanOrder = {
  _id: mongoose.Types.ObjectId;
  tableId?: string;
  sessionId?: string;
  status: OrderStatus;
  createdAt: Date;
};

/* ============================================================
   CONTROLLER
============================================================ */

/**
 * GET /api/vendor/orders?status=NEW
 * Vendor read-only order listing (MVP)
 */
export async function getVendorOrders(
  req: Request,
  res: Response
) {
  try {
    const status =
      req.query.status as OrderStatus | undefined;

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id tableId sessionId status createdAt")
      .lean<LeanOrder[]>();

    res.json({
      data: orders.map((o: any) => ({
        id: o._id.toString(),
        tableId: o.tableId,
        sessionId: o.sessionId,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("getVendorOrders error:", error);
    res.status(500).json({
      message: "Failed to fetch vendor orders",
    });
  }
}
