import { Request, Response } from "express";
import MenuDraftSnapshot from "../modules/menu/menu.snapshot.model";
import { handleImageOcrUpload } from "../modules/menu/ocr.service";
import MenuParser from "../modules/menu/menu.parser";
import MenuCommitService from "../modules/menu/menu.commit.service";
import Vendor from "../models/Vendor.model";

/* ============================================================
   UPLOAD MENU → OCR → DRAFT SNAPSHOT
============================================================ */
export const uploadMenuController = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    /* 1️⃣ FILE VALIDATION */
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Menu file is required",
      });
    }

    /* 2️⃣ AUTH VALIDATION */
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /* 3️⃣ VENDOR OWNERSHIP */
    const vendor = await Vendor.findOne({ user: userId });
    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    /* 4️⃣ OCR PROCESSING */
    const ocrResult = await handleImageOcrUpload(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!ocrResult?.rawText?.trim()) {
      return res.status(422).json({
        success: false,
        message: "OCR produced no readable text",
      });
    }

    /* 5️⃣ MENU PARSING */
    const mapping = MenuParser.parseTextToMenu(
      ocrResult.rawText
    );

    /* 6️⃣ SNAPSHOT CREATION (SINGLE SOURCE OF TRUTH) */
    const snapshot = await MenuDraftSnapshot.create({
      restaurantId: vendor._id,
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
      mapping?.flatMap((c: any) => c.items || []) || [];

    return res.status(201).json({
      success: true,
      snapshotId: snapshot._id,
      status: "DRAFT",
      items,
    });
  } catch (err: any) {
    console.error("MENU UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Menu upload failed",
    });
  }
};

/* ============================================================
   GET LATEST ACTIVE DRAFT SNAPSHOT
============================================================ */
export const getCurrentMenuSnapshot = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const vendor = await Vendor.findOne({ user: userId });
    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    const draft = await MenuDraftSnapshot.findOne({
      restaurantId: vendor._id,
      status: "DRAFT",
    }).sort({ createdAt: -1 });

    if (!draft) {
      return res.status(200).json(null);
    }

    const items =
      draft.mapping?.flatMap((c: any) => c.items || []) || [];

    return res.status(200).json({
      snapshotId: draft._id,
      status: "DRAFT",
      items,
    });
  } catch (err) {
    console.error("GET CURRENT SNAPSHOT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load menu snapshot",
    });
  }
};

/* ============================================================
   COMMIT DRAFT SNAPSHOT → LIVE MENU ITEMS
   Publishes OCR'd menu items to the Item model (goes LIVE)
============================================================ */
export const commitMenuDraftController = async (
  req: Request & { user?: { id: string } },
  res: Response
) => {
  try {
    /* 1️⃣ SNAPSHOT ID & AUTH VALIDATION */
    const { snapshotId } = req.params;
    const userId = req.user?.id;

    if (!snapshotId) {
      return res.status(400).json({
        success: false,
        message: "Snapshot ID is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    /* 2️⃣ VENDOR OWNERSHIP VALIDATION */
    const vendor = await Vendor.findOne({ user: userId });
    if (!vendor) {
      return res.status(403).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    /* 3️⃣ SNAPSHOT OWNERSHIP VALIDATION */
    const snapshot = await MenuDraftSnapshot.findById(snapshotId);
    if (!snapshot) {
      return res.status(404).json({
        success: false,
        message: "Draft snapshot not found",
      });
    }

    // Verify this snapshot belongs to this vendor
    if (snapshot.restaurantId.toString() !== vendor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not own this menu draft",
      });
    }

    // Prevent double-committing
    if (snapshot.status === "COMMITTED") {
      return res.status(400).json({
        success: false,
        message: "This menu has already been published",
      });
    }

    /* 4️⃣ COMMIT THE DRAFT → LIVE ITEMS */
    const result = await MenuCommitService.commitMapping({
      restaurantId: vendor._id.toString(),
      snapshotId,
      committedBy: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Menu published successfully",
      data: {
        snapshotId,
        itemsCreated: result.itemsCreated,
        itemsUpdated: result.itemsUpdated,
        totalItems: result.itemsCreated + result.itemsUpdated,
      },
    });
  } catch (err: any) {
    console.error("MENU COMMIT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to publish menu",
    });
  }
};
