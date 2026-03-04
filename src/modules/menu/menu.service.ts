import { Router } from "express";
import multer from "multer";

/* 🔐 AUTH MIDDLEWARE */
import { authenticate } from "../../middleware/auth.middleware";

import {
  uploadMenuController,
  getCurrentMenuSnapshot,
} from "../../controllers/menu.upload.controller";

import { getDraftSnapshot } from "./menu.controller";

const router = Router();

/* ============================================================
   MULTER CONFIG — MEMORY STORAGE
============================================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/* ============================================================
   MENU ROUTES — AUTHENTICATED
============================================================ */

/**
 * Upload menu image
 * Field name MUST be "menu"
 */
router.post(
  "/upload",
  authenticate,
  upload.single("menu"),
  uploadMenuController
);

/**
 * Get latest draft snapshot
 */
router.get(
  "/current",
  authenticate,
  getCurrentMenuSnapshot
);

/**
 * Get draft snapshot by ID (read-only)
 */
router.get(
  "/draft/:snapshotId",
  authenticate,
  getDraftSnapshot
);

export default router;
