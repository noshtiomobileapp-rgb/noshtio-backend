// src/modules/menu/menu.controller.ts

import { Request, Response } from "express";
import MenuService from "./menu.service";
import { handleImageOcrUpload } from "./ocr.service";
import MenuParser from "./menu.parser";
import MenuMapper from "./menu.mapper"; // ✅ Added for mapping engine

const service = new MenuService();

/* ============================================================
   1. MANUAL MENU CREATION
   ============================================================ */
export const uploadManual = async (req: Request, res: Response) => {
  try {
    const { vendorId, categoryName, itemName, price, description } = req.body;

    if (!vendorId || !categoryName || !itemName) {
      return res.status(400).json({
        success: false,
        message: "vendorId, categoryName, and itemName are required.",
      });
    }

    const menu = await service.createManualMenu({
      vendorId,
      categoryName,
      itemName,
      price,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Menu item added manually.",
      menu,
    });
  } catch (err) {
    console.error("uploadManual error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during manual menu creation.",
    });
  }
};

/* ============================================================
   2. OCR UPLOAD + PARSING + MAPPING (UPDATED)
   ============================================================ */
export const uploadOCR = async (req: any, res: Response) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image not received. Ensure multer memoryStorage() is used.",
      });
    }

    // 1. OCR + upload to S3 (if configured)
    const ocr = await handleImageOcrUpload(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const rawText = ocr.rawText || "";

    // 2. Parse OCR text into menu variants
    const parsedVariants = MenuParser.parseTextToMenuVariants(rawText);

    const preferred =
      parsedVariants.smart.categories.length > 0
        ? parsedVariants.smart
        : parsedVariants.strict;

    // 3. NEW — Mapping engine to database categories & items
    const vendorId = req.body?.vendorId || req.query?.vendorId || null;

    const mapping = await MenuMapper.mapParsedMenuToCategories(preferred, {
      restaurantId: vendorId || undefined,
      fuzzyThreshold: 0.40, // tuneable threshold
    });

    // 4. Respond
    return res.json({
      success: true,
      rawText,
      parsed: parsedVariants,
      preferred,
      uploadedFileUrl: ocr.uploadedFileUrl || null,
      mapping, // ← mapped results added
    });
  } catch (err) {
    console.error("uploadOCR error:", err);
    return res.status(500).json({
      success: false,
      message: "OCR processing failed.",
    });
  }
};

/* ============================================================
   3. SAVE OCR MENU (after vendor edits manually in dashboard)
   ============================================================ */
export const saveOCRMenu = async (req: Request, res: Response) => {
  try {
    const { vendorId, menu } = req.body;

    if (!vendorId || !menu) {
      return res.status(400).json({
        success: false,
        message: "vendorId and menu payload are required.",
      });
    }

    const saved = await service.saveMenu(vendorId, menu);

    return res.json({
      success: true,
      message: "OCR menu saved successfully.",
      menu: saved,
    });
  } catch (err) {
    console.error("saveOCRMenu error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to save OCR menu.",
    });
  }
};

/* ============================================================
   4. GET MENU FOR DASHBOARD
   ============================================================ */
export const getMenu = async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.vendorId;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId parameter is required.",
      });
    }

    const menu = await service.getMenu(vendorId);

    return res.json({
      success: true,
      menu: menu || { categories: [] },
    });
  } catch (err) {
    console.error("getMenu error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor menu.",
    });
  }
};
