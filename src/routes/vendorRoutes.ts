import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/* ============================================================
   VENDOR BASE ROUTES
============================================================ */

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.json({
      success: true,
      vendorId: req.user.id,
      userId: req.user.id,
      role: req.user.role,
    });

  } catch (error) {
    console.error("Vendor /me error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;