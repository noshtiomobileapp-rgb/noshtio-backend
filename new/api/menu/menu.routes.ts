import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import vendorGuard from "../../middleware/vendor.guard";

import {
  uploadMenuOcr,
  getCurrentMenuSnapshot,
  getDraftSnapshot,
  reviewDraftItem,
  commitMenu,
  getVendorMenu,
  getPublicMenu,
  uploadItemImage,
} from "./menu.controller";

const router = Router();

/* ============================================================
   VENDOR-PROTECTED ROUTES
============================================================ */

router.use(authMiddleware, vendorGuard);

// OCR → Draft
router.post("/ocr/upload", uploadMenuOcr);

// Draft snapshots
router.get("/draft/current", getCurrentMenuSnapshot);
router.get("/draft/:snapshotId", getDraftSnapshot);
router.patch(
  "/draft/:snapshotId/category/:categoryIndex/item/:itemIndex/review",
  reviewDraftItem
);

// Commit menu
router.post("/commit", commitMenu);

// Vendor menu
router.get("/vendor/:vendorId", getVendorMenu);

// Upload item image
router.post("/item/:itemId/image", uploadItemImage);

/* ============================================================
   PUBLIC ROUTES (NO AUTH)
============================================================ */

router.get("/public", getPublicMenu);

export default router;
