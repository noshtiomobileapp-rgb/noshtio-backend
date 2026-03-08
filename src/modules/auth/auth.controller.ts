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
   COOKIE CONFIG
============================================================ */

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
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

    if (role === "vendor") {
      await Vendor.create({
        user: newUser._id,
        name,
        email,
        status: "ACTIVE",
      });
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
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let vendorId: string | undefined;

    if (user.role === "vendor") {
      const vendor = await Vendor.findOne({ user: user._id });
      vendorId = vendor?._id?.toString();
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "JWT configuration missing",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        vendorId,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" }
    );

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

export const getCurrentUser = (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  return res.json({
    success: true,
    user,
  });
};

/* ============================================================
   LOGOUT
============================================================ */

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });

  return res.json({
    success: true,
    message: "Logged out",
  });
};