import { Request, Response } from "express";
import {
  placeOrder,
  getOrderDetails,
  getCustomerOrders,
} from "./order.placement.service";

/* ============================================================
   PLACE ORDER
   POST /api/orders
   Customer submits cart items, system validates against live menu
============================================================ */

export const placeOrderHandler = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id;
    const { vendorId, items, tableId, deliveryAddress, specialNote } = req.body;

    // Validate input
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId is required",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required with at least one item",
      });
    }

    // Validate each item has itemId and quantity
    for (const item of items) {
      if (!item.itemId || typeof item.quantity !== "number") {
        return res.status(400).json({
          success: false,
          message: "Each item must have itemId (string) and quantity (number)",
        });
      }
    }

    // Either tableId or deliveryAddress should be provided
    if (!tableId && !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message:
          "Either tableId (for dine-in) or deliveryAddress (for delivery) is required",
      });
    }

    // Place the order
    const order = await placeOrder({
      vendorId,
      customerId,
      items,
      tableId,
      deliveryAddress,
      specialNote,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err: any) {
    console.error("PLACE ORDER ERROR:", err);

    // User-friendly error messages
    if (
      err.message.includes("Invalid vendor ID") ||
      err.message.includes("Invalid item ID")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format in request",
      });
    }

    if (err.message.includes("not found") || err.message.includes("unavailable")) {
      return res.status(400).json({
        success: false,
        message:
          "One or more items are not available. Please refresh menu and try again.",
      });
    }

    if (err.message.includes("Cart must contain")) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to place order",
    });
  }
};

/* ============================================================
   GET ORDER STATUS
   GET /api/orders/:orderId
   Customers view their order status
============================================================ */

export const getOrderStatusHandler = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await getOrderDetails(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (err: any) {
    console.error("GET ORDER STATUS ERROR:", err);

    if (err.message.includes("Invalid order ID")) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch order",
    });
  }
};

/* ============================================================
   LIST CUSTOMER ORDERS
   GET /api/orders/customer/my-orders
   Logged-in customers view all their orders
============================================================ */

export const listCustomerOrdersHandler = async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const orders = await getCustomerOrders(customerId);

    return res.json({
      success: true,
      data: {
        customerId,
        orderCount: orders.length,
        orders,
      },
    });
  } catch (err: any) {
    console.error("LIST CUSTOMER ORDERS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch orders",
    });
  }
};
