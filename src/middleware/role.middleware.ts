import { Request, Response, NextFunction } from "express";

/**
 * Role Middleware
 * Usage:
 *    roleMiddleware("admin")
 *    roleMiddleware("staff", "admin")
 */
export const roleMiddleware =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      const userRole = user.role;

      if (!userRole) {
        return res.status(403).json({ message: "Forbidden: Missing user role" });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied: Requires role ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        message: "Role validation error",
        error: (err as any).message,
      });
    }
  };

export default roleMiddleware;
