import { Router, Request, Response } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import roleMiddleware from "../../middleware/role.middleware";

const router = Router();

// Public route for testing
router.get("/public", (_req: Request, res: Response) => {
  res.json({ message: "Public route. No auth required." });
});

// Protected: Logged-in users only
router.get(
  "/protected",
  authMiddleware,
  (req: Request, res: Response) => {
    res.json({
      message: "You accessed a protected route",
      user: (req as any).user,
    });
  }
);

// Admin-only route
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  (req: Request, res: Response) => {
    res.json({
      message: "Admin route accessed successfully",
      user: (req as any).user,
    });
  }
);

export default router;
