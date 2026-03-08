import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* ============================================================
   EXTEND EXPRESS REQUEST TYPE
============================================================ */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/* ============================================================
   JWT PAYLOAD TYPE
============================================================ */
interface JwtPayload {
  userId: string;
  role: string;
}

/* ============================================================
   REQUIRE AUTH — COOKIE BASED
============================================================ */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
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
      console.error("JWT_SECRET missing in environment variables");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    /* ============================================================
       ATTACH AUTH DATA TO REQUEST
    ============================================================ */
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth verification failed:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};