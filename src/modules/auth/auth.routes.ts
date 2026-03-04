import { Router } from "express";
import { register, login, logout, getCurrentUser } from "./auth.controller";
import { requireAuth } from "../../middleware/requireAuth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/current", requireAuth, getCurrentUser);

export default router;
