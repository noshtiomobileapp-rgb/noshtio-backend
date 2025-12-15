import { Router } from "express";
import { register, login, logout } from "./auth.controller";

const router = Router();

// ROUTES
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
