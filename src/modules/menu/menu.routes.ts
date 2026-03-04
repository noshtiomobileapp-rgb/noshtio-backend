import { Router, Request, Response } from "express";
import multer from "multer";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import VendorMenuDraft from "./menu.model"; // Default import fixes TS2614
import { requireAuth } from "../../middleware/requireAuth";

const visionClient = new ImageAnnotatorClient(); 
const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// FIX: Added 'role' to satisfy your global express.d.ts requirement (TS2430)
interface AuthRequest extends Request {
  user?: { 
    id: string; 
    role: string; 
  };
  file?: Express.Multer.File;
}

/* GET /current - Prevents redirect loop by returning object instead of null */
router.get("/current", requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const vendorId = authReq.user?.id;

    if (!vendorId) return res.status(401).json({ message: "Unauthorized" });

    const draft = await VendorMenuDraft.findOne({ vendorId, status: "DRAFT" });
    
    return res.status(200).json(draft || { snapshotId: null, items: [], status: "NONE" });
  } catch (err) {
    console.error("GET /current error:", err);
    return res.status(500).json({ status: "ERROR", items: [] });
  }
});

/* POST /upload - Google Vision OCR */
router.post("/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.file) return res.status(400).json({ message: "No file uploaded" });

    const [result] = await visionClient.textDetection(authReq.file.buffer);
    const text = result.fullTextAnnotation?.text || "";

    const items = text.split("\n")
      .filter(line => line.trim().length > 1)
      .map(name => ({ name: name.trim(), price: null }));

    const draft = await VendorMenuDraft.findOneAndUpdate(
      { vendorId: authReq.user?.id },
      { items, status: "DRAFT" },
      { upsert: true, new: true }
    );

    return res.status(200).json({ 
      success: true, 
      snapshotId: draft!._id.toString(), 
      items: draft!.items 
    });
  } catch (err) {
    console.error("OCR Error:", err);
    return res.status(500).json({ message: "OCR Failed" });
  }
});

export default router;