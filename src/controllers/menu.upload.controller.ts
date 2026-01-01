import { Request, Response } from "express";
import MenuDraftSnapshot from "../modules/menu/menu.snapshot.model";
import { handleImageOcrUpload } from "../modules/menu/ocr.service";
import MenuParser from "../modules/menu/menu.parser";

/* ============================================================
   UPLOAD MENU (OCR → DRAFT SNAPSHOT)
============================================================ */
export const uploadMenuController = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Menu file is required",
      });
    }

    const restaurantId = (req as any).user?.tenantId;
    if (!restaurantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /* OCR → RAW TEXT */
    const ocrResult = await handleImageOcrUpload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!ocrResult.rawText?.trim()) {
      return res.status(422).json({
        success: false,
        message: "OCR produced no readable text",
      });
    }

    /* PARSE INTO MENU STRUCTURE */
    const mapping = MenuParser.parseTextToMenu(
      ocrResult.rawText
    );

    /* CREATE DRAFT SNAPSHOT */
    const snapshot = await MenuDraftSnapshot.create({
      restaurantId,
      sourceFile: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        url: ocrResult.uploadedFileUrl,
      },
      rawText: ocrResult.rawText,
      mapping,
      status: "DRAFT",
      committedAt: null,
      committedBy: null,
    });

    const items =
      mapping.flatMap((c: any) => c.items || []) || [];

    return res.json({
      success: true,
      snapshotId: snapshot._id,
      items,
      status: "DRAFT",
    });
  } catch (err: any) {
    console.error("MENU UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Menu upload failed",
    });
  }
};

/* ============================================================
   GET LATEST DRAFT SNAPSHOT
============================================================ */
export const getCurrentMenuSnapshot = async (
  req: any,
  res: Response
) => {
  const restaurantId = req.user?.tenantId;

  if (!restaurantId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const draft = await MenuDraftSnapshot.findOne({
    restaurantId,
    status: "DRAFT",
  }).sort({ createdAt: -1 });

  if (!draft) {
    return res.json(null);
  }

  const items =
    draft.mapping?.flatMap((c: any) => c.items || []) || [];

  return res.json({
    snapshotId: draft._id,
    items,
    status: "DRAFT",
  });
};
