import { Router } from "express";
import multer from "multer";
import {
  uploadMenuController,
  getCurrentMenuSnapshot,
} from "../controllers/menu.upload.controller";

const router = Router();
const upload = multer();

/* ============================================================
   ROUTES
============================================================ */
router.post(
  "/upload",
  upload.single("file"),
  uploadMenuController
);

router.get(
  "/current",
  getCurrentMenuSnapshot
);

export default router;
