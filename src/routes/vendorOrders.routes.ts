import { Router } from "express";
import { getVendorOrders } from "../controllers/vendorOrders.controller";
import authMiddleware from "../middleware/auth.middleware";
import vendorGuard from "../middleware/vendor.guard";

const router = Router();

/**
 * Vendor Orders
 * GET /api/vendor/orders
 */
router.get(
  "/orders",
  authMiddleware,
  vendorGuard,
  getVendorOrders
);

export default router;
