import { Router } from "express";
import { register, login, logout, getCurrentUser } from "./auth.controller";

// ✅ Named import — matches the exports in auth.middleware.ts
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

/* ── Public routes ─────────────────────────────────────── */
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

/* ── Protected routes ──────────────────────────────────── */
router.get("/me", requireAuth, getCurrentUser);

// Keep /current as alias so existing frontend calls don't break
router.get("/current", requireAuth, getCurrentUser);

export default router;