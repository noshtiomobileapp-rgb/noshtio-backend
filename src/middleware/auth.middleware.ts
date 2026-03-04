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
   CORE AUTH LOGIC (INTERNAL)
============================================================ */
const attachUserIfValid = (req: AuthenticatedRequest): boolean => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return false;

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) return false;

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    return true;
  } catch {
    return false;
  }
};

/* ============================================================
   AUTHENTICATE (STRICT) — named export
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
   OPTIONAL AUTH — named export
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
   DEFAULT EXPORT — REQUIRED BY MULTIPLE MODULES
============================================================ */
const authMiddleware = authenticate;
export default authMiddleware;
