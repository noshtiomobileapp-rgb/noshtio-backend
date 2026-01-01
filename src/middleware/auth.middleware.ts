import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error("JWT_SECRET is not defined");
}
const JWT_SECRET: string = JWT_SECRET_RAW;

/* ============================================================
   TYPES
============================================================ */

export type DecodedUser = JwtPayload & {
  id: string;
  role: string;
  tenantId?: string;
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

/* ============================================================
   HELPERS
============================================================ */

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
}

function assertDecodedUser(payload: JwtPayload): DecodedUser {
  if (
    typeof payload.id !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid JWT payload");
  }
  return payload as DecodedUser;
}

/* ============================================================
   AUTH MIDDLEWARE
============================================================ */

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Token missing" });
    }

    const verified = jwt.verify(token, JWT_SECRET);
    if (typeof verified !== "object") {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const decoded = assertDecodedUser(verified);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tenantId: decoded.tenantId, // optional
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized: Invalid or expired token",
    });
  }
}

/* ============================================================
   OPTIONAL AUTH
============================================================ */

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const verified = jwt.verify(token, JWT_SECRET);
    if (typeof verified !== "object") return next();

    const decoded = assertDecodedUser(verified);

    req.user = {
      id: decoded.id,
      role: decoded.role,
      tenantId: decoded.tenantId,
    };
  } catch {
    // ignore
  }
  next();
}

export default authMiddleware;
