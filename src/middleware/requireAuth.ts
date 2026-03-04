import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* ============================================================
   TYPES
============================================================ */
interface JwtPayload {
  userId: string;
  role: string;
}

/* ============================================================
   REQUIRE AUTH — COOKIE BASED (TYPE SAFE)
============================================================ */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    /* ============================================================
       ATTACH AUTH CONTEXT ONLY (NOT MONGOOSE DOC)
    ============================================================ */
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
