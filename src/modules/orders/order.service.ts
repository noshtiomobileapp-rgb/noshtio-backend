import mongoose from "mongoose";
import { OrderModel, IOrderItem, OrderStatus } from "./order.model";
import Item from "../menu/models/item.model";

/* ------------------------------------------------------------------
   TYPES
------------------------------------------------------------------- */

type CreateOrderInput = {
  userId: string | null;
  tenantId?: string | null;
  sessionId?: string;
  tableId?: string | null;
  items: {
    itemId: string;
    qty: number;
    notes?: string;
  }[];
  instructions?: string;
  payment?: any;
};

/* ------------------------------------------------------------------
   CREATE ORDER
------------------------------------------------------------------- */

export async function createOrder(input: CreateOrderInput) {
  let {
    userId,
    tenantId,
    sessionId,
    tableId,
    items,
    instructions,
    payment,
  } = input;

  if (!userId && !sessionId) {
    sessionId = `guest_${Date.now()}`;
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items array is required");
  }

  for (const item of items) {
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      throw new Error("Invalid quantity");
    }
    if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
      throw new Error("Invalid itemId");
    }
  }

  const dbItems = await Item.find({
    _id: { $in: items.map((i) => i.itemId) },
  }).lean();

  if (dbItems.length !== items.length) {
    throw new Error("Item mismatch");
  }

  let subtotal = 0;

  const orderItems: IOrderItem[] = items.map((i) => {
    const db = dbItems.find((d) => String(d._id) === i.itemId)!;
    const total = db.price! * i.qty;
    subtotal += total;

    return {
      itemId: db._id,
      name: db.name,
      qty: i.qty,
      price: db.price!,
      total,
      notes: i.notes,
    };
  });

  return OrderModel.create({
    userId: userId ?? null,
    tenantId: tenantId ?? null,
    sessionId: sessionId ?? null,
    tableId: tableId ?? null,
    items: orderItems,
    subtotal,
    tax: 0,
    total: subtotal,
    status: "NEW",
    payment,
    instructions,
  });
}

/* ------------------------------------------------------------------
   GET ORDER BY ID (READ-ONLY, POLLING SAFE)
------------------------------------------------------------------- */

export async function getOrderById(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order id");
  }

  return OrderModel.findById(orderId).lean();
}

/* ------------------------------------------------------------------
   LIST ORDERS
------------------------------------------------------------------- */

export async function listOrders(params: {
  userId?: string;
  status?: OrderStatus;
}) {
  const query: any = {};
  if (params.userId) query.userId = params.userId;
  if (params.status) query.status = params.status;

  return OrderModel.find(query)
    .sort({ createdAt: -1 })
    .lean();
}

/* ------------------------------------------------------------------
   UPDATE ORDER STATUS (STRICT LINEAR FLOW)
------------------------------------------------------------------- */

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid status transition ${order.status} → ${nextStatus}`
    );
  }

  order.status = nextStatus;

  const now = new Date();
  if (nextStatus === "PREPARING") order.preparingAt = now;
  if (nextStatus === "READY") order.readyAt = now;
  if (nextStatus === "COMPLETED") order.completedAt = now;

  await order.save();
  return order;
}

/* ------------------------------------------------------------------
   CANCEL ORDER
------------------------------------------------------------------- */

export async function cancelOrder(orderId: string) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new Error("Order not found");

  order.status = "CANCELLED";
  await order.save();
  return order;
}
