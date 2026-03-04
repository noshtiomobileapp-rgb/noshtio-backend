import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/User.model";
import Vendor from "../../models/Vendor.model";

export interface AuthRequest extends Request {
  user?: any;
  vendor?: any;
}

const vendorAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check for Authorization header or cookie
    const header = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    const token = header?.startsWith("Bearer ")
      ? header.split(" ")[1]
      : cookieToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;

    // Debug: show decoded payload
    console.log("Decoded ID:", decoded.id);

    // Find user
    const user = await User.findById(decoded.id);
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Find vendor linked to this user
    const vendor = await Vendor.findOne({ user: user._id });
    console.log("Vendor lookup:", vendor);

    if (!vendor) {
      return res.status(401).json({ success: false, message: "Unauthorized: Vendor not found" });
    }

    req.vendor = vendor;
    return next();
  } catch (error) {
    console.error("Vendor auth error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default vendorAuth;
