import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/* ============================================================
   AUTH USER TYPE (COMPATIBLE WITH OLD ROUTES)
============================================================ */

export interface AuthUser {
  id: string;
  role: string;
  userId?: string;
  vendorId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/* ============================================================
   JWT PAYLOAD
============================================================ */

interface JwtPayload {
  userId: string;
  vendorId?: string;
  role: string;
}

/* ============================================================
   TOKEN EXTRACTOR
============================================================ */

const extractToken = (req: Request): string | null => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    const cookies = (req as any).cookies;

    if (cookies?.auth_token) {
      return cookies.auth_token;
    }

    return null;
  } catch {
    return null;
  }
};

/* ============================================================
   VERIFY TOKEN
============================================================ */

const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET missing");
      return null;
    }

    return jwt.verify(token, secret) as JwtPayload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
};

/* ============================================================
   ATTACH USER
============================================================ */

const attachUser = (req: AuthenticatedRequest): boolean => {
  const token = extractToken(req);

  if (!token) return false;

  const decoded = verifyToken(token);

  if (!decoded) return false;

  req.user = {
    id: decoded.userId,
    userId: decoded.userId,
    vendorId: decoded.vendorId,
    role: decoded.role,
  };

  return true;
};

/* ============================================================
   STRICT AUTH
============================================================ */

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const ok = attachUser(req);

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
  attachUser(req);
  next();
};

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default authenticate;