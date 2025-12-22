// src/modules/menu/menu.routes.ts

import { Router } from "express";
import multer from "multer";
import {
  getMenu,
  getPublicMenu,
  commitMenu,
  uploadOCR,
  saveOCRMenu,
} from "./menu.controller";

const router = Router();

/* ============================================================
   Multer setup (OCR image upload)
   ============================================================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ============================================================
   OCR flow
   ============================================================ */

// Step 1: Upload image → parse OCR (draft only)
router.post("/ocr", upload.single("image"), uploadOCR);

// Step 2: Save categorized draft snapshot
router.post("/save", saveOCRMenu);

/* ============================================================
   Existing menu APIs
   ============================================================ */

router.get("/public", getPublicMenu);
router.get("/:vendorId", getMenu);
router.post("/commit", commitMenu);

export default router;
