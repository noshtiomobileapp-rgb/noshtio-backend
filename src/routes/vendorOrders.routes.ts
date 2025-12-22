import { Router } from "express";
import { getVendorOrders } from "../controllers/vendorOrders.controller";

const router = Router();

/**
 * Vendor Orders
 * GET /api/vendor/orders
 */
router.get("/orders", getVendorOrders);

export default router;
