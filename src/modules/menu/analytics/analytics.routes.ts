import { Router } from "express";

/* 🔐 AUTH MIDDLEWARE — SINGLE SOURCE OF TRUTH */
import { authenticate } from "../../../middleware/auth.middleware";

import { getVendorAnalyticsSummary } from "./analytics.controller";

const router = Router();

/* ============================================================
   ANALYTICS ROUTES (AUTHENTICATED)
============================================================ */

/**
 * Vendor analytics summary
 * GET /api/vendor/analytics/summary
 */
router.get(
  "/summary",
  authenticate,
  getVendorAnalyticsSummary
);

export default router;
