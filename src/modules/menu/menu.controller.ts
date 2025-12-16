import { Request, Response } from "express";
import MenuService from "./menu.service";
import { handleImageOcrUpload } from "./ocr.service";
import MenuParser from "./menu.parser";
import MenuMapper from "./menu.mapper";

// ✅ DEFAULT-EXPORTED INSTANCE
import MenuCommitService from "./menu.commit.service";

// 🔐 STEP 5 — DTO Validation (LOCKED)
import { CommitPayloadSchema } from "./menu.commit.schema";

// Canonical types expected by mapper
import {
  ParsedMenuCategory,
  ParsedMenuShape,
} from "./ocr.types";

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
  } catch (error) {
    console.error("uploadManual error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during manual menu creation.",
    });
  }
};

/* ============================================================
   2. OCR UPLOAD + PARSING + MAPPING
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

    const ocrResult = await handleImageOcrUpload(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const rawText = ocrResult.rawText || "";
    const parsed = MenuParser.parseTextToMenu(rawText);

    const categories: ParsedMenuCategory[] = parsed.map((cat) => ({
      name: cat.category,
      items: cat.items.map((item) => ({
        name: item.name,
        price: item.price,
      })),
    }));

    const parsedShape: ParsedMenuShape = { categories };

    const vendorId =
      req.body?.vendorId || req.query?.vendorId || undefined;

    const mapping = await MenuMapper.mapParsedMenuToCategories(
      parsedShape,
      {
        restaurantId: vendorId,
        fuzzyThreshold: 0.4,
      }
    );

    return res.json({
      success: true,
      rawText,
      uploadedFileUrl: ocrResult.uploadedFileUrl || null,
      menu: parsedShape.categories,
      mapping,
    });
  } catch (error) {
    console.error("uploadOCR error:", error);
    return res.status(500).json({
      success: false,
      message: "OCR processing failed.",
    });
  }
};

/* ============================================================
   3. SAVE OCR MENU (SNAPSHOT)
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
  } catch (error) {
    console.error("saveOCRMenu error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save OCR menu.",
    });
  }
};

/* ============================================================
   4. GET MENU
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
  } catch (error) {
    console.error("getMenu error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor menu.",
    });
  }
};

/* ============================================================
   5. COMMIT APPROVED MENU (STEP 4 → STEP 5 LOCK)
   ============================================================ */
export const commitMenu = async (req: Request, res: Response) => {
  try {
    // 🔒 STEP 5 — Enforce API contract (NO MANUAL VALIDATION)
    CommitPayloadSchema.parse(req.body);

    const { restaurantId, mapping } = req.body;

    const result = await MenuCommitService.commitMapping({
      restaurantId,
      mapping,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("commitMenu error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to commit menu.",
    });
  }
};
