import multer from "multer";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const uploadItemImage = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB (per item image)
  },

  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG, or WEBP images are allowed")
      );
    }
    cb(null, true);
  },
});
