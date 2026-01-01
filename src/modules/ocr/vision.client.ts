// src/modules/ocr/vision.client.ts

import vision from "@google-cloud/vision";
import path from "path";

const keyPath = path.join(
  process.cwd(),
  "src",
  "config",
  "google-vision-key.json"
);

export const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: keyPath,
});
