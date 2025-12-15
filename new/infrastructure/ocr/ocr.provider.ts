/**
 * ocr.provider.ts
 * Very small adapter that chooses an OCR implementation.
 *
 * Add concrete implementations under /infrastructure/ocr (tesseract / googleVision).
 * For now both implementations are included inline for clarity (simple placeholders).
 */

import fs from "fs";
import { exec } from "child_process";
import util from "util";

const execP = util.promisify(exec);

export class OCRProvider {
  private providerName: string;

  constructor(providerName?: string) {
    // choose provider by env var or argument
    this.providerName = providerName || process.env.OCR_PROVIDER || "tesseract";
  }

  async recognize(filePath: string): Promise<string> {
    if (this.providerName === "google") {
      return this.googleVisionOCR(filePath);
    }
    // default to tesseract
    return this.tesseractOCR(filePath);
  }

  // simple tesseract call — requires tesseract installed on the host
  private async tesseractOCR(filePath: string): Promise<string> {
    try {
      const outFile = `${filePath}.txt`;
      // tesseract <input> <output-without-extension>
      const cmd = `tesseract ${filePath} ${filePath}`;
      await execP(cmd);
      const raw = await fs.promises.readFile(outFile, "utf-8");
      // cleanup outFile if you want (tesseract writes filePath.txt)
      return raw;
    } catch (err: any) {
      // fallback simple using node-tesseract-ocr or throw meaningful error
      throw new Error("Tesseract OCR failed: " + err.message);
    }
  }

  // placeholder for Google Vision — replace with official client usage
  private async googleVisionOCR(filePath: string): Promise<string> {
    /**
     * Real implementation: use @google-cloud/vision with credentials
     * const client = new vision.ImageAnnotatorClient({ keyFilename: 'google-vision-key.json' })
     * const [result] = await client.textDetection(filePath);
     * return result.fullTextAnnotation?.text || '';
     */
    // Minimal placeholder:
    return Promise.resolve("GOOGLE_VISION_PLACEHOLDER_TEXT");
  }
}
