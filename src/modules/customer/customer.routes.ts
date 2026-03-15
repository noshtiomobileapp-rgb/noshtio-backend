import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getMyProfileHandler,
  createProfileHandler,
  updateProfileHandler,
} from "./customer.controller";

const router = Router();

/* ============================================================
   CUSTOMER PROFILE ROUTES
   All routes require authentication
============================================================ */

// GET /api/customers/me — view current customer profile
router.get("/me", requireAuth, getMyProfileHandler);

// POST /api/customers/profile — create customer profile
router.post("/profile", requireAuth, createProfileHandler);

// PUT /api/customers/profile — update customer profile
router.put("/profile", requireAuth, updateProfileHandler);

export default router;
