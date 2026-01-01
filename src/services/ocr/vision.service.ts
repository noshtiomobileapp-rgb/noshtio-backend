// backend/src/services/ocr/vision.service.ts
import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

export async function extractText(buffer: Buffer): Promise<string> {
  const [result] = await client.textDetection(buffer);
  return result.fullTextAnnotation?.text ?? "";
}
