import { Router } from "express";
import multer from "multer";

// ✅ requireAuth — the actual exported name from auth.middleware.ts
import { requireAuth } from "../../middleware/auth.middleware";

import {
  uploadMenuController,
  getCurrentMenuSnapshot,
  commitMenuDraftController,
} from "../../controllers/menu.upload.controller";

import { getDraftSnapshot } from "./menu.controller";
import { getCustomerMenuHandler } from "./menu.customer.controller";

const router = Router();

/* ============================================================
   MULTER CONFIG
============================================================ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WEBP images are allowed"));
    }
  },
});

/* ============================================================
   MENU ROUTES
============================================================ */

// POST /api/menu/upload — upload menu image, run OCR
router.post(
  "/upload",
  requireAuth,
  upload.single("menu"),
  uploadMenuController
);

// GET /api/menu/current — latest published snapshot for this vendor
router.get(
  "/current",
  requireAuth,
  getCurrentMenuSnapshot
);

// GET /api/menu/draft/:snapshotId — read a specific draft by ID
router.get(
  "/draft/:snapshotId",
  requireAuth,
  getDraftSnapshot
);

// POST /api/menu/commit/:snapshotId — publish draft as live menu items
router.post(
  "/commit/:snapshotId",
  requireAuth,
  commitMenuDraftController
);

// GET /api/menu?vendorId=XXX — customer browsing menu (PUBLIC)
router.get("/", getCustomerMenuHandler);

export default router;