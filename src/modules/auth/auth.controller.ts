import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../../models/User.model";
import Vendor from "../../models/Vendor.model";

/* ============================================================
   CONSTANTS
============================================================ */

const COOKIE_NAME = "auth_token";
const JWT_EXPIRY = "7d";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT expiry
};

/* ============================================================
   HELPERS
============================================================ */

function buildTokenPayload(
  userId: string,
  role: string,
  vendorId?: string
) {
  return { id: userId, role, vendorId };
}

function missingFields(res: Response, ...fields: (string | undefined)[]) {
  return fields.some((f) => !f);
}

/* ============================================================
   REGISTER
============================================================ */

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "name, email, password and role are all required",
      });
    }

    const emailLower = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: emailLower }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
      role,
    });

    // Auto-create Vendor record for vendor registrations
    if (role === "vendor") {
      const vendorExists = await Vendor.findOne({ user: newUser._id });
      if (!vendorExists) {
        await Vendor.create({
          user: newUser._id,
          name: name.trim(),
          email: emailLower,
          status: "ACTIVE",
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("[register]", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   LOGIN
============================================================ */

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("[login] JWT_SECRET is not set");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Use same message for missing user and wrong password
    // to avoid user enumeration
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Fetch vendorId if applicable
    let vendorId: string | undefined;
    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: user._id }).lean();
      if (vendor) vendorId = vendor._id.toString();
    }

    const payload = buildTokenPayload(user._id.toString(), user.role, vendorId);
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        vendorId,
      },
    });
  } catch (error) {
    console.error("[login]", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   CURRENT USER
============================================================ */

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Re-fetch from DB so the response always has fresh data
    const user = await User.findById(req.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("[getCurrentUser]", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ============================================================
   LOGOUT
============================================================ */

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
