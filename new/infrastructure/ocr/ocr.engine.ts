/**
 * ocr.engine.ts
 * Abstracted engine runner — supports simple Tesseract or Google Vision adapter usage.
 * Implementations are placeholders — replace with real SDK calls in production.
 */

import fs from "fs";
import path from "path";
import { OCRProvider } from "./ocr.provider";

export class OCREngine {
  private provider: OCRProvider;

  constructor(provider?: OCRProvider) {
    this.provider = provider ?? new OCRProvider();
  }

  /**
   * Accepts a local file path and returns extracted plain text
   */
  async recognize(filePath: string): Promise<string> {
    // provider chooses the concrete implementation (tesseract / cloud)
    return this.provider.recognize(filePath);
  }

  // cleanup helper if you want to remove file afterwards
  async removeFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      // ignore
    }
  }
}
