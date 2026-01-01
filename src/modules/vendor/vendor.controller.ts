import { Response } from "express";
import { AuthRequest } from "./vendor.middleware";

export const getVendorMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // You can enrich this later from DB if needed
  res.json({
    id: req.user.id,
    tenantId: req.user.tenantId,
    email: req.user.email,
  });
};
