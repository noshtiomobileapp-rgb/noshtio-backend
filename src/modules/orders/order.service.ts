import mongoose from "mongoose";
import { OrderModel, OrderStatus } from "./order.model";

/* ============================================================
   TYPES
============================================================ */

type CreateOrderInput = {
  vendorId: string;
  totalAmount: number;
};

/* ============================================================
   CREATE ORDER (MVP MINIMAL)
============================================================ */

export async function createOrder(
  input: CreateOrderInput
) {
  const { vendorId, totalAmount } = input;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendorId");
  }

  if (totalAmount < 0) {
    throw new Error("Invalid totalAmount");
  }

  return OrderModel.create({
    vendorId,
    totalAmount,
    status: "NEW",
  });
}

/* ============================================================
   GET ORDER BY ID
============================================================ */

export async function getOrderById(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order id");
  }

  return OrderModel.findById(orderId).lean();
}

/* ============================================================
   LIST ORDERS
============================================================ */

export async function listOrders(params: {
  vendorId?: string;
  status?: OrderStatus;
}) {
  const query: Record<string, any> = {};

  if (params.vendorId) {
    query.vendorId = params.vendorId;
  }

  if (params.status) {
    query.status = params.status;
  }

  return OrderModel.find(query)
    .sort({ createdAt: -1 })
    .lean();
}

/* ============================================================
   UPDATE ORDER STATUS (STRICT FLOW)
============================================================ */

const VALID_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
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

  if (!order) {
    throw new Error("Order not found");
  }

  const allowed =
    VALID_TRANSITIONS[order.status as OrderStatus];

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid status transition ${order.status} → ${nextStatus}`
    );
  }

  order.status = nextStatus;
  await order.save();

  return order;
}

/* ============================================================
   CANCEL ORDER
============================================================ */

export async function cancelOrder(orderId: string) {
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  order.status = "CANCELLED";
  await order.save();

  return order;
}

/* ============================================================
   VENDOR DASHBOARD — ORDERS SUMMARY
============================================================ */

export async function getVendorOrdersSummary(
  vendorId: string
) {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendorId");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [result] = await OrderModel.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      },
    },
    {
      $group: {
        _id: null,
        ordersToday: { $sum: 1 },
        revenueToday: {
          $sum: {
            $cond: [
              { $eq: ["$status", "COMPLETED"] },
              "$totalAmount",
              0,
            ],
          },
        },
        pendingOrders: {
          $sum: {
            $cond: [
              {
                $in: ["$status", ["NEW", "PREPARING"]],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    ordersToday: result?.ordersToday ?? 0,
    revenueToday: result?.revenueToday ?? 0,
    pendingOrders: result?.pendingOrders ?? 0,
  };
}
