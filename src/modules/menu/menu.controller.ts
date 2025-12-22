// C:\backend_old\src\modules\menu\menu.controller.ts

import { Request, Response } from "express";
import { createWorker } from "tesseract.js";

import MenuService from "./menu.service";
import Item from "./item.model";
import MenuCommitService from "./menu.commit.service";
import MenuDraftSnapshot from "./menu.snapshot.model";
import { CommitPayloadSchema } from "./menu.commit.schema";

const service = new MenuService();

/* =======================
   GET MENU (Vendor)
   ======================= */
export const getMenu = async (req: Request, res: Response) => {
  const menu = await service.getMenu(req.params.vendorId);
  res.json({ success: true, menu });
};

/* =======================
   GET PUBLIC MENU
   ======================= */
export const getPublicMenu = async (req: Request, res: Response) => {
  const { restaurantId } = req.query;

  if (!restaurantId) {
    return res
      .status(400)
      .json({ success: false, message: "restaurantId required" });
  }

  const items = await Item.find({
    restaurantId,
    available: true,
  }).lean();

  res.json({ success: true, items });
};

/* =======================
   OCR UPLOAD (REAL OCR, TYPE-SAFE)
   ======================= */
export const uploadOCR = async (req: Request, res: Response) => {
  let worker: any;

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file missing" });
    }

    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res
        .status(400)
        .json({ success: false, message: "restaurantId missing" });
    }

    /* ---------- OCR WORKER ---------- */
    worker = await createWorker("eng");

    await worker.setParameters({
      tessedit_pageseg_mode: 6, // uniform text block (menus)
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789₹Rs./ ",
    });

    const {
      data: { text },
    } = await worker.recognize(req.file.buffer);

    await worker.terminate();

    /* ---------- NORMALIZATION ---------- */
    const rawText = text || "";

    const normalizedText = rawText
      .replace(/[^\x20-\x7E₹]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    /* ---------- PARSING ---------- */
    const parsedItems = normalizedText
      .split(/(?<=\d)\s+/)
      .map((chunk: string) => {
        const match = chunk.match(
          /(.+?)\s*(₹|rs\.?|rs)?\s*(\d{2,4})/i
        );
        if (!match) return null;

        return {
          name: match[1].trim(),
          price: Number(match[3]),
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      restaurantId,
      parsedItems,
      rawText,
      normalizedText,
    });
  } catch (e: any) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }

    res.status(500).json({ success: false, message: e.message });
  }
};

/* =======================
   SAVE OCR DRAFT
   ======================= */
export const saveOCRMenu = async (req: Request, res: Response) => {
  try {
    const { restaurantId, mapping } = req.body;

    if (!restaurantId || !mapping) {
      return res.status(400).json({
        success: false,
        message: "restaurantId and mapping are required",
      });
    }

    const snapshot = await MenuDraftSnapshot.create({
      restaurantId,
      mapping,
      committedAt: null,
      committedBy: null,
    });

    res.json({ success: true, snapshotId: snapshot._id });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* =======================
   COMMIT MENU
   ======================= */
export const commitMenu = async (req: Request, res: Response) => {
  try {
    CommitPayloadSchema.parse(req.body);

    const { restaurantId, snapshotId } = req.body;

    const result = await MenuCommitService.commitMapping({
      restaurantId,
      snapshotId,
      committedBy: "system",
    });

    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
