import multer from "multer";

/**
 * Multer middleware for MENU OCR uploads
 *
 * - Uses memory storage (required for Google Vision buffer-based OCR)
 * - Accepts images + PDF
 * - Enforces size limit
 * - Does NOT write to disk
 *
 * This middleware is SAFE and INTENTIONAL for OCR flows.
 */

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const uploadMenuFile = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Only JPG, PNG, WEBP images or PDF files are allowed."
        )
      );
    }

    cb(null, true);
  },
});
