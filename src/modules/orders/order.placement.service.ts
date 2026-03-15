import mongoose from "mongoose";
import Item from "../menu/item.model";
import Order from "./order.model";

/* ============================================================
   ORDER PLACEMENT SERVICE
   Validates cart items against live menu, creates order
============================================================ */

export interface CartItem {
  itemId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  vendorId: string;
  customerId?: string;
  items: CartItem[];
  tableId?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  specialNote?: string;
}

export interface ValidatedOrderItem {
  itemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

/* ============================================================
   VALIDATE CART AGAINST LIVE MENU PRICES
   Returns server-calculated total and validated items
============================================================ */

export async function validateCartItems(
  vendorId: string,
  items: CartItem[]
): Promise<{
  validatedItems: ValidatedOrderItem[];
  totalAmount: number;
}> {
  // Validate vendorId
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendor ID");
  }

  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }

  // Validate each item has required fields
  for (const item of items) {
    if (!item.itemId || !item.quantity) {
      throw new Error("Each item must have itemId and quantity");
    }
    if (item.quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }
    if (!mongoose.Types.ObjectId.isValid(item.itemId)) {
      throw new Error(`Invalid item ID: ${item.itemId}`);
    }
  }

  const rid = new mongoose.Types.ObjectId(vendorId);
  const itemIds = items.map((i) => new mongoose.Types.ObjectId(i.itemId));

  // Fetch items from database (must be available + belong to vendor)
  const dbItems = await Item.find({
    _id: { $in: itemIds },
    restaurantId: rid,
    available: true,
  }).lean();

  if (dbItems.length !== items.length) {
    throw new Error(
      "One or more items not found, unavailable, or don't belong to this vendor"
    );
  }

  // Create lookup map
  const itemMap = new Map(dbItems.map((item: any) => [item._id.toString(), item]));

  // Validate and calculate totals
  let serverTotalAmount = 0;
  const validatedItems: ValidatedOrderItem[] = [];

  for (const cartItem of items) {
    const dbItem = itemMap.get(cartItem.itemId);
    if (!dbItem) {
      throw new Error(`Item ${cartItem.itemId} not found`);
    }

    const subtotal = dbItem.price * cartItem.quantity;
    serverTotalAmount += subtotal;

    validatedItems.push({
      itemId: dbItem._id,
      name: dbItem.name,
      price: dbItem.price,
      quantity: cartItem.quantity,
      subtotal,
    });
  }

  return {
    validatedItems,
    totalAmount: serverTotalAmount,
  };
}

/* ============================================================
   PLACE ORDER
   Creates order after cart validation
============================================================ */

export async function placeOrder(
  input: PlaceOrderInput
): Promise<{
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  vendorId: string;
  customerId?: string;
  itemCount: number;
}> {
  // Validate vendor exists
  if (!mongoose.Types.ObjectId.isValid(input.vendorId)) {
    throw new Error("Invalid vendor ID");
  }

  // Validate cart
  const { validatedItems, totalAmount } = await validateCartItems(
    input.vendorId,
    input.items
  );

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // Create order
  const order = await Order.create({
    vendorId: new mongoose.Types.ObjectId(input.vendorId),
    customerId: input.customerId
      ? new mongoose.Types.ObjectId(input.customerId)
      : null,
    items: validatedItems,
    status: "NEW",
    totalAmount,
    tableId: input.tableId || null,
    orderNumber,
    specialNote: input.specialNote || null,
  });

  return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    vendorId: order.vendorId.toString(),
    customerId: input.customerId,
    itemCount: validatedItems.length,
  };
}

/* ============================================================
   GET ORDER DETAILS
============================================================ */

export async function getOrderDetails(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  return Order.findById(orderId)
    .populate("vendorId", "name email")
    .populate("customerId", "email firstName lastName")
    .populate("items.itemId", "name price")
    .lean();
}

/* ============================================================
   GET CUSTOMER ORDERS
============================================================ */

export async function getCustomerOrders(customerId: string) {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new Error("Invalid customer ID");
  }

  return Order.find({ customerId: new mongoose.Types.ObjectId(customerId) })
    .populate("vendorId", "name")
    .sort({ createdAt: -1 })
    .lean();
}
