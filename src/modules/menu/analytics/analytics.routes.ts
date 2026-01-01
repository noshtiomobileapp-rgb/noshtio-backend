import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import vendorGuard from "../../../middleware/vendor.guard";
import { getVendorAnalyticsSummary } from "./analytics.controller";

const router = Router();

router.use(authMiddleware, vendorGuard);

router.get("/summary", getVendorAnalyticsSummary);

export default router;
