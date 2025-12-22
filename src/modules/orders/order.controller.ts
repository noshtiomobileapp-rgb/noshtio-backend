import { Request, Response } from "express";
import * as OrderService from "./order.service";
import { OrderStatus } from "./order.model";

/* ------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------- */

const getUserId = (req: Request): string | null =>
  (req as any).user?.id ?? null;

const resolveSessionId = (req: Request): string | undefined => {
  const headerSid = req.headers["x-session-id"];
  if (typeof headerSid === "string" && headerSid.trim() !== "") {
    return headerSid;
  }

  if (
    typeof req.body?.sessionId === "string" &&
    req.body.sessionId.trim() !== ""
  ) {
    return req.body.sessionId;
  }

  return undefined;
};

/* ------------------------------------------------------------------
   ALLOWED ORDER STATUSES (CANONICAL)
------------------------------------------------------------------- */

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "NEW",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

/* ------------------------------------------------------------------
   CREATE ORDER
------------------------------------------------------------------- */

export const createOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await OrderService.createOrder({
      userId: getUserId(req),
      sessionId: resolveSessionId(req),
      tenantId: req.body.tenantId ?? null,
      tableId: req.body.tableId ?? null,
      items: req.body.items,
      instructions: req.body.instructions,
      payment: req.body.payment,
    });

    res.status(201).json({ data: order });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ------------------------------------------------------------------
   GET ORDER (CUSTOMER POLLING)
------------------------------------------------------------------- */

export const getOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ data: order });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ------------------------------------------------------------------
   LIST ORDERS
------------------------------------------------------------------- */

export const listOrdersHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await OrderService.listOrders({
      userId: getUserId(req) ?? undefined,
      status: req.query.status as OrderStatus | undefined,
    });

    res.json({ data: orders });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ------------------------------------------------------------------
   UPDATE ORDER STATUS
------------------------------------------------------------------- */

export const updateOrderStatusHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const status = req.body.status as OrderStatus;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await OrderService.updateOrderStatus(
      req.params.id,
      status
    );

    res.json({ data: order });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ------------------------------------------------------------------
   CANCEL ORDER
------------------------------------------------------------------- */

export const cancelOrderHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await OrderService.cancelOrder(req.params.id);
    res.json({ data: order });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
