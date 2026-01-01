import vision from "@google-cloud/vision";

/**
 * Single Google Vision client instance
 */
const client = new vision.ImageAnnotatorClient();

/**
 * Extract OCR text from an in-memory file buffer.
 * Supports images and PDFs.
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    let text: string | undefined;

    // PDFs
    if (mimeType === "application/pdf") {
      const [result] = await client.documentTextDetection({
        image: { content: buffer },
      });

      text = result.fullTextAnnotation?.text ?? undefined;
    }
    // Images
    else {
      const [result] = await client.textDetection({
        image: { content: buffer },
      });

      text = result.fullTextAnnotation?.text ?? undefined;
    }

    if (!text || text.trim().length === 0) {
      throw new Error("OCR returned empty text");
    }

    return text;
  } catch (error) {
    console.error("Vision OCR failed:", error);
    throw error;
  }
}
