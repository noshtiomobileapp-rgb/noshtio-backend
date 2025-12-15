// @ts-nocheck

import vision from "@google-cloud/vision";
import path from "path";

/**
 * Initialize Google Vision client using the JSON key
 */
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../../config/google-vision-key.json"),
});

/**
 * Runs OCR on an uploaded menu image and returns extracted text
 * @param imagePath path to uploaded file (multer upload or filesystem path)
 */
export async function runOCR(imagePath: string): Promise<string> {
  try {
    console.log("🔍 Running Google Vision OCR on:", imagePath);

    const [result] = await client.textDetection(imagePath);

    if (
      !result ||
      !result.textAnnotations ||
      result.textAnnotations.length === 0
    ) {
      console.log("⚠️ No text detected.");
      return "";
    }

    const extractedText = result.textAnnotations[0].description;

    console.log("📄 OCR Extracted Text:");
    console.log(extractedText);

    return extractedText;
  } catch (error) {
    console.error("❌ Google Vision OCR Error:", error);
    throw error;
  }
}
