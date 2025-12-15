// src/services/menuOCR.ts
import { ImageAnnotatorClient } from "@google-cloud/vision";
import fs from "fs";

const client = new ImageAnnotatorClient(); // uses GOOGLE_APPLICATION_CREDENTIALS

export class MenuOCR {
  static async extractText(filePath: string): Promise<string> {
    // If PDF or multi-page, use documentTextDetection per page (Vision auto handles)
    const [result] = await client.textDetection(filePath);
    // fullTextAnnotation has more structured text
    const annotation = result.fullTextAnnotation;
    const text = annotation ? annotation.text : (result.textAnnotations && result.textAnnotations[0] && result.textAnnotations[0].description) || "";
    return text || "";
  }

  static parseMenuItems(ocrText: string) {
    // Normalize lines
    const lines = ocrText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const items: { name: string; price: number }[] = [];
    // Common regex: name ... price (price at end)
    const priceRegex = /(?:₹|\$)?\s*([0-9]{1,5}(?:[.,][0-9]{1,2})?)\s*$/; // captures price at end
    for (const line of lines) {
      // remove stray bullets or decorative chars
      const clean = line.replace(/^[\u2022\-\*]+\s*/, "").replace(/\s{2,}/g, " ");
      const match = clean.match(priceRegex);
      if (match) {
        const priceRaw = match[1].replace(",", "."); // 1,200 -> 1.200
        const price = Math.round(parseFloat(priceRaw));
        const name = clean.slice(0, match.index).replace(/[-:]+$/, "").trim();
        if (name && !isNaN(price)) items.push({ name, price });
      }
    }

    // If nothing found, fallback: try lines that contain a number anywhere
    if (items.length === 0) {
      for (const line of lines) {
        const m = line.match(/(.+?)\s+([0-9]{2,4})/);
        if (m) items.push({ name: m[1].trim(), price: parseInt(m[2]) });
      }
    }

    return items;
  }
}
