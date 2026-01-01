import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export function vendorGuard(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized: Authentication required",
    });
  }

  /**
   * MVP rule:
   * If a user is authenticated and accessing vendor routes,
   * allow access. Role hard-check can be enforced later
   * once role issuance is fully standardized.
   */
  next();
}

export default vendorGuard;
