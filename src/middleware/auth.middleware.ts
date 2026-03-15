import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/AppError';

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  vendorId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ── Core JWT verification ──────────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
}

// ── Role guard ─────────────────────────────────────────────────────────────

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

// ── Vendor ownership guard ─────────────────────────────────────────────────
// Ensures the authenticated user belongs to the vendor being accessed.

export function requireVendorOwnership(
  getVendorId: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    const targetVendorId = getVendorId(req);
    if (
      req.user.role !== 'super_admin' &&
      req.user.vendorId !== targetVendorId
    ) {
      return next(new AppError('Access denied to this vendor', 403));
    }
    next();
  };
}

// ── Optional auth (for public routes that benefit from user context) ───────

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
  } catch {
    // Ignore invalid token on optional routes
  }
  next();
}

// ── Aliases for compatibility ──────────────────────────────────────────────

export const authenticate = requireAuth;

// ── Default export (for routes that use "import authMiddleware")
export default requireAuth;
