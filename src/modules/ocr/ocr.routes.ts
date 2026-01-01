// src/modules/ocr/ocr.routes.ts

import { Router } from "express";
import multer from "multer";
import { extractOCR } from "./ocr.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

router.post(
  "/extract",
  authMiddleware,
  upload.single("file"),
  extractOCR
);

export default router;
