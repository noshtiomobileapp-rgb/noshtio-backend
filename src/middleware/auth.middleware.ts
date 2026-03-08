import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload as BaseJwtPayload } from "jsonwebtoken";

/* ============================================================
   TYPES
============================================================ */

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

interface JwtPayload extends BaseJwtPayload {
  userId: string;
  role: string;
}

/* ============================================================
   TOKEN EXTRACTOR
============================================================ */

const extractToken = (req: Request): string | null => {
  try {
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
  } catch {
    return null;
  }
};

/* ============================================================
   CORE AUTH LOGIC
============================================================ */

const attachUserIfValid = (req: AuthenticatedRequest): boolean => {
  try {
    const token = extractToken(req);

    if (!token) {
      return false;
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET missing in environment");
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return false;
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    return true;
  } catch (error) {
    console.error("JWT verification failed:", error);
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
      message: "Unauthorized",
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