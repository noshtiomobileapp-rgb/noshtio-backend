import { Router } from "express";

import { getVendorOrders } from "../controllers/vendorOrders.controller";
import { getVendorMe } from "../controllers/vendorMe.controller";

/* 🔐 AUTH MIDDLEWARE — NAMED EXPORT (CONFIRMED WORKING) */
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/* ============================================================
   VENDOR ROUTES (AUTHENTICATED)
============================================================ */

/**
 * Vendor profile
 * GET /api/vendor/me
 */
router.get(
  "/me",
  authenticate,
  getVendorMe
);

/**
 * Vendor orders
 * GET /api/vendor/orders
 */
router.get(
  "/orders",
  authenticate,
  getVendorOrders
);

export default router;
