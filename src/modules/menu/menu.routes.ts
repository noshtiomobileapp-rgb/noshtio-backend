// src/modules/menu/menu.routes.ts

import { Router } from "express";
import multer from "multer";
import {
  uploadManual,
  uploadOCR,
  saveOCRMenu,
  getMenu,
} from "./menu.controller";

// If authentication for menu operations is required,
// uncomment this import and apply it to protected routes.
// import authMiddleware from "../../middleware/authMiddleware";

const router = Router();

/* ============================================================
   MULTER SETUP FOR OCR IMAGES (REQUIRED FOR GOOGLE VISION)
   ============================================================ */
const upload = multer({
  storage: multer.memoryStorage(), // OCR needs buffer-based upload
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/* ============================================================
   ROUTE: Manual Menu Creation
   Path: POST /menu/manual
   Body:
   {
     vendorId: string,
     categoryName: string,
     itemName: string,
     price?: number,
     description?: string
   }
   ============================================================ */
router.post("/manual", upload.none(), uploadManual);

/* ============================================================
   ROUTE: OCR Menu Upload
   Path: POST /menu/ocr
   Form-Data:
     image: File
   Returns:
     - rawText
     - parsed.strict
     - parsed.smart
     - preferred (smart OR strict)
   ============================================================ */
router.post("/ocr", upload.single("image"), uploadOCR);

/* ============================================================
   ROUTE: Save OCR Menu (after vendor editing on UI)
   Path: POST /menu/save
   Body:
   {
     vendorId: string,
     menu: {
       categories: [...]
     }
   }
   ============================================================ */
router.post("/save", upload.none(), saveOCRMenu);

/* ============================================================
   ROUTE: Fetch Vendor Menu
   Path: GET /menu/:vendorId
   Returns:
     - full menu or empty structure
   ============================================================ */
router.get("/:vendorId", getMenu);

export default router;
