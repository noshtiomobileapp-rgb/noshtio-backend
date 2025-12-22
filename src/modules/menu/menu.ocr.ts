import vision from "@google-cloud/vision";
import path from "path";

/**
 * Initialize Google Vision client using the JSON key
 */
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../../config/google-vision-key.json"),
});

/**
 * Runs OCR on an uploaded menu image and returns extracted RAW text
 * NOTE:
 * - No parsing
 * - No normalization
 * - No business logic
 * This is intentional (Step 3 architecture)
 */
export async function runOCR(imagePath: string): Promise<string> {
  try {
    console.log("🔍 Running Google Vision OCR on:", imagePath);

    const [result] = await client.textDetection(imagePath);

    if (!result?.textAnnotations || result.textAnnotations.length === 0) {
      console.warn("⚠️ No text detected by OCR");
      return "";
    }

    const extractedText = result.textAnnotations[0]?.description ?? "";

    console.log("📄 OCR Extracted Text (raw):");
    console.log(extractedText);

    return extractedText;
  } catch (error) {
    console.error("❌ Google Vision OCR Error:", error);
    throw new Error("OCR processing failed");
  }
}
