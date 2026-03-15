import { Router, Request, Response } from "express";
import multer from "multer";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { VendorMenuDraft } from "../models/VendorMenuDraft.model";
import { requireAuth } from "../middleware/auth.middleware";

const visionClient = new ImageAnnotatorClient(); 
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

type AuthRequest = Request & { user?: { id: string; role: string }; file?: Express.Multer.File };

/**
 * GET /current
 * FIX: Professional-grade error handling to prevent UI "Spinners" or "Redirect Loops"
 */
router.get("/current", requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const vendorId = authReq.user?.id;

    // If requireAuth passed but no user ID is found, the session is corrupted
    if (!vendorId) {
      console.error("Auth middleware passed but no User ID found in request");
      return res.status(401).json({ message: "Session invalid" });
    }

    const draft = await VendorMenuDraft.findOne({ vendorId, status: "DRAFT" });

    // Return an object structure the frontend expects 100% of the time
    return res.status(200).json(draft ? {
      snapshotId: draft._id.toString(),
      items: draft.items,
      status: draft.status,
    } : { 
      snapshotId: null, 
      items: [], 
      status: "NONE" 
    });
  } catch (err) {
    console.error("GET /current logic error:", err);
    return res.status(500).json({ status: "ERROR", items: [] });
  }
});

/**
 * POST /upload (Google Vision OCR Integration)
 */
router.post("/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.file) return res.status(400).json({ success: false, message: "No image file uploaded" });

    // Extract text using Google Vision
    const [result] = await visionClient.textDetection(authReq.file.buffer);
    const text = result.fullTextAnnotation?.text || "";

    // Professional Parsing: Clean whitespace and remove empty lines
    const menuItems = text.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 1)
      .map(name => ({ name, price: null }));

    // Upsert the draft so the user doesn't lose data on refresh
    const draft = await VendorMenuDraft.findOneAndUpdate(
      { vendorId: authReq.user?.id },
      { items: menuItems, status: "DRAFT", updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({ 
      success: true, 
      snapshotId: draft!._id, 
      items: draft!.items 
    });
  } catch (err) {
    console.error("Vision OCR Route Error:", err);
    return res.status(500).json({ success: false, message: "OCR processing failed" });
  }
});

export default router;