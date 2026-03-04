import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.model";
import Vendor from "../../models/Vendor.model";

/* ============================================================
   CONSTANTS
============================================================ */
const COOKIE_NAME = "auth_token";

/* ============================================================
   COOKIE OPTIONS
============================================================ */
const cookieOptions = {
  httpOnly: true,
  secure: false, // set true in production with HTTPS
  sameSite: "lax" as const,
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

/* ============================================================
   REGISTER
============================================================ */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    /* CREATE VENDOR PROFILE */
    if (role === "vendor") {
      const existingVendor = await Vendor.findOne({
        user: newUser._id,
      });

      if (!existingVendor) {
        await Vendor.create({
          user: newUser._id,
          name,
          email,
          status: "ACTIVE",
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      console.error("JWT_SECRET missing");

      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ============================================================
   CURRENT USER
============================================================ */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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