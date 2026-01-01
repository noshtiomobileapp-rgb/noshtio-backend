// src/modules/ocr/ocr.controller.ts

import { Request, Response } from "express";
import { extractTextFromImage } from "./ocr.service";

export async function extractOCR(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const text = await extractTextFromImage(req.file.buffer);

    return res.json({
      success: true,
      rawText: text,
    });
  } catch (error: any) {
    console.error("OCR error:", error.message);

    return res.status(500).json({
      success: false,
      message: "OCR processing failed",
    });
  }
}
