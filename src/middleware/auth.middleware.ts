import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* ============================================================
   TYPES
============================================================ */

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

interface JwtPayload {
  userId: string;
  role: string;
}

/* ============================================================
   TOKEN EXTRACTOR
============================================================ */

const extractToken = (req: Request): string | null => {
  /* 1️⃣ Authorization Header */

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  /* 2️⃣ Cookie */

  if (req.cookies?.auth_token) {
    return req.cookies.auth_token;
  }

  return null;
};

/* ============================================================
   CORE AUTH LOGIC
============================================================ */

const attachUserIfValid = (req: AuthenticatedRequest): boolean => {
  try {
    const token = extractToken(req);

    if (!token) return false;

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    return true;
  } catch (error) {
    return false;
  }
};

/* ============================================================
   AUTHENTICATE (STRICT)
============================================================ */

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const ok = attachUserIfValid(req);

  if (!ok) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  next();
};

/* ============================================================
   OPTIONAL AUTH
============================================================ */

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  attachUserIfValid(req);
  next();
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

const authMiddleware = authenticate;
export default authMiddleware;