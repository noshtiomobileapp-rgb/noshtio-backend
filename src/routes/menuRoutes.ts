import { Router } from "express";
import Menu from "../models/Menu.model";

const router = Router();

/* ============================================================
   PUBLIC MENU ROUTES
============================================================ */

/**
 * GET /api/menu/:vendorId
 * Public menu for customers
 */
router.get("/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const menu = await Menu.findOne({
      vendorId,
      isActive: true,
    }).lean();

    if (!menu) {
      return res.status(404).json({ success: false });
    }

    return res.json(menu);
  } catch (err) {
    console.error("GET /api/menu failed", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
