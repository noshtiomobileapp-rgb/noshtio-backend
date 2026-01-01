// src/modules/ocr/ocr.service.ts

import { visionClient } from "./vision.client";

export async function extractTextFromImage(
  buffer: Buffer
): Promise<string> {
  const [result] = await visionClient.textDetection(buffer);

  return result.fullTextAnnotation?.text ?? "";
}
