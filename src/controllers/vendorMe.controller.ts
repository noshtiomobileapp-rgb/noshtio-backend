import { Response } from "express";
import Vendor from "../models/Vendor.model";
import User from "../models/User.model";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * GET /api/vendor/me
 * - Requires authenticated user (cookie-based)
 * - Auto-creates Vendor profile if missing
 */
export const getVendorMe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user!.id;

  // Try to find existing vendor
  let vendor = await Vendor.findOne({ user: userId });

  if (!vendor) {
    const user = await User.findById(userId);

    if (!user || user.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    /**
     * IMPORTANT:
     * Do NOT assume optional fields (like name) unless guaranteed by IUser.
     * Use safe fallbacks.
     */
    vendor = await Vendor.create({
      user: user._id,
      email: user.email,
      role: "vendor",
      name: user.email.split("@")[0], // safe fallback
    });
  }

  return res.json(vendor);
};
