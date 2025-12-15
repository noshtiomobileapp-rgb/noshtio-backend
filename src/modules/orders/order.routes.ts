import express from "express";
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
  cancelOrderHandler,
} from "./order.controller";

import authMiddleware from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";

const router = express.Router();

router.post("/", authMiddleware, createOrderHandler);
router.get("/", authMiddleware, listOrdersHandler);
router.get("/:id", authMiddleware, getOrderHandler);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("staff", "admin"),
  updateOrderStatusHandler
);

router.post("/:id/cancel", authMiddleware, cancelOrderHandler);

export default router;
