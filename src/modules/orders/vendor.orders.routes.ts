import express from "express";
import { vendorOrdersSummaryHandler } from "./order.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

/**
 * Vendor Order APIs
 * Mounted at: /vendor/orders
 */

// Vendor dashboard summary
router.get(
  "/summary",
  authMiddleware,
  vendorOrdersSummaryHandler
);

export default router;
