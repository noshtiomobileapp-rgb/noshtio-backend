import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/* ============================================================
   VENDOR BASE ROUTES (MVP)
============================================================ */

router.get("/me", requireAuth, async (req, res) => {
  return res.json({
    success: true,
    vendorId: req.user!.id,
    role: req.user!.role,
  });
});

export default router;
