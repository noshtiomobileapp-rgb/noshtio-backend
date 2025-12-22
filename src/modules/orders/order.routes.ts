import express from "express";
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
  cancelOrderHandler,
} from "./order.controller";

import authMiddleware, {
  optionalAuth,
} from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";

const router = express.Router();

/**
 * Customer Order APIs
 * Mounted at: /api/customer/orders
 */

// ✅ GUEST + LOGGED-IN
router.post("/", optionalAuth, createOrderHandler);
router.get("/:id", optionalAuth, getOrderHandler);

// ✅ LOGGED-IN ONLY
router.get("/", authMiddleware, listOrdersHandler);

// ✅ STAFF / ADMIN
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  updateOrderStatusHandler
);

router.post("/:id/cancel", authMiddleware, cancelOrderHandler);

export default router;
