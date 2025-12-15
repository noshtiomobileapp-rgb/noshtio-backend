import { Router } from "express";
import { OCRController } from "./ocr.controller";
import { upload } from "../../core/utils/file-upload";

const router = Router();
const controller = new OCRController();

/**
 * POST /api/ocr/upload
 * multipart/form-data { image: File }
 */
router.post("/upload", upload.single("image"), controller.uploadImage);

export default router;
