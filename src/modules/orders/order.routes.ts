import express from "express";
import {
  placeOrderHandler,
  getOrderStatusHandler,
  listCustomerOrdersHandler,
} from "./order.placement.controller";
import {
  updateOrderStatusHandler,
  cancelOrderHandler,
} from "./order.controller";

import authMiddleware, {
  optionalAuth,
} from "../../middleware/auth.middleware";

const router = express.Router();

/* ============================================================
   CUSTOMER ORDER APIS
   Mounted at: /api/orders
============================================================ */

// POST /api/orders — place new order (guest + logged-in)
router.post("/", optionalAuth, placeOrderHandler);

// GET /api/orders/:orderId — view order status (guest + logged-in)
router.get("/:orderId", optionalAuth, getOrderStatusHandler);

// GET /api/orders/customer/my-orders — list customer's orders (logged-in only)
router.get("/customer/my-orders", authMiddleware, listCustomerOrdersHandler);

// PATCH /api/orders/:id/status — update order status (vendor staff only)
router.patch("/:id/status", authMiddleware, updateOrderStatusHandler);

// POST /api/orders/:id/cancel — cancel order
router.post("/:id/cancel", authMiddleware, cancelOrderHandler);

export default router;
