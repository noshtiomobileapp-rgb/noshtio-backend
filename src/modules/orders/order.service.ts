import mongoose from "mongoose";
import { OrderModel, OrderStatus, OrderItem } from "./order.model";
import Item from "../menu/item.model";

/* ============================================================
   TYPES
============================================================ */

type CreateOrderInput = {
  vendorId: string;
  customerId?: string | null;
  items: Array<{ itemId: string; quantity: number }>;
  totalAmount: number;
  tableId?: string;
  orderNumber?: string;
  specialNote?: string;
};

/* ============================================================
   HELPER: GENERATE ORDER NUMBER
============================================================ */

function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
}

/* ============================================================
   VALIDATE & CREATE ORDER (WITH PRICE RECALCULATION)
============================================================ */

export async function validateAndCreate(input: CreateOrderInput) {
  const {
    vendorId,
    customerId = null,
    items: itemsInput,
    totalAmount: clientTotalAmount,
    tableId,
    orderNumber = generateOrderNumber(),
    specialNote,
  } = input;

  // Validate vendorId
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendorId");
  }

  // Validate items array
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // Fetch items from database to verify & get prices
  const itemIds = itemsInput.map((i) => i.itemId);
  const dbItems = await Item.find({
    _id: { $in: itemIds },
    restaurantId: vendorId,
    available: true,
  });

  if (dbItems.length !== itemsInput.length) {
    throw new Error(
      "One or more items not found or unavailable for this vendor"
    );
  }

  // Build order items with server-side prices
  let serverTotalAmount = 0;
  const orderItems: OrderItem[] = itemsInput.map((input) => {
    const dbItem = dbItems.find((i) => i._id.toString() === input.itemId);
    if (!dbItem) throw new Error(`Item ${input.itemId} not found`);

    const subtotal = dbItem.price * input.quantity;
    serverTotalAmount += subtotal;

    return {
      itemId: dbItem._id,
      name: dbItem.name,
      price: dbItem.price,
      quantity: input.quantity,
      subtotal,
    };
  });

  // Price tampering check: client total must match server calculation
  if (Math.abs(serverTotalAmount - clientTotalAmount) > 1) {
    throw new Error(
      `Price mismatch: client sent ${clientTotalAmount}, server calculated ${serverTotalAmount}`
    );
  }

  return OrderModel.create({
    vendorId,
    customerId: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : null,
    items: orderItems,
    status: "NEW",
    totalAmount: serverTotalAmount,
    tableId,
    orderNumber,
    specialNote,
  });
}

/* ============================================================
   CREATE ORDER (MVP MINIMAL)
============================================================ */

export async function createOrder(
  input: Omit<CreateOrderInput, 'items'> & { totalAmount: number }
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
    items: [],
    totalAmount,
    status: "NEW",
    orderNumber: generateOrderNumber(),
  });
}

/* ============================================================
   GET ORDER BY ID
============================================================ */

export async function getOrderById(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order id");
  }

  return OrderModel.findById(orderId)
    .populate("vendorId", "name email")
    .populate("customerId", "email")
    .populate("items.itemId", "name")
    .lean();
}

export async function findById(orderId: string) {
  return getOrderById(orderId);
}

/* ============================================================
   LIST ORDERS
============================================================ */

export async function listOrders(params: {
  vendorId?: string;
  customerId?: string;
  status?: OrderStatus;
}) {
  const query: Record<string, any> = {};

  if (params.vendorId) {
    query.vendorId = params.vendorId;
  }

  if (params.customerId) {
    query.customerId = params.customerId;
  }

  if (params.status) {
    query.status = params.status;
  }

  return OrderModel.find(query)
    .populate("vendorId", "name")
    .populate("items.itemId", "name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function findByVendorId(vendorId: string) {
  return listOrders({ vendorId });
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

export async function updateStatus(
  orderId: string,
  nextStatus: OrderStatus
) {
  return updateOrderStatus(orderId, nextStatus);
}

/* ============================================================
   CANCEL ORDER
============================================================ */

export async function cancelOrder(orderId: string) {
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "NEW") {
    throw new Error(
      `Cannot cancel order with status ${order.status}. Only NEW orders can be cancelled.`
    );
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
