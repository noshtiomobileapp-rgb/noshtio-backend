import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

/**
 * Vendor Guard — MVP Safe
 *
 * Rule:
 * - User MUST be authenticated
 * - Role enforcement intentionally deferred
 */
export function vendorGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication required",
    });
  }

  // MVP: allow authenticated users accessing vendor routes
  next();
}

export default vendorGuard;
