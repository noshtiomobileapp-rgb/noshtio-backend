import { Router } from "express";
import { register, login, logout, getCurrentUser } from "./auth.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/current", authMiddleware, getCurrentUser);

export default router;