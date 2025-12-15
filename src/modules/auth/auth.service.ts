// src/modules/auth/auth.service.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../models/User";

export class AuthService {
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || "defaultSecretKey";
  private readonly TOKEN_EXPIRY: string = "1h";

  // ------------------------
  // REGISTER
  // ------------------------
  async register(name: string, email: string, password: string, role: string) {
    if (!name || !email || !password) {
      return { success: false, message: "Name, email and password are required" };
    }

    const existing = await User.findOne({ email }).exec();
    if (existing) {
      return { success: false, message: "Email already exists" };
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role,
      isLoggedIn: true,
      lastLoginAt: new Date()
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    return {
      success: true,
      message: "Registration successful",
      token
    };
  }

  // ------------------------
  // LOGIN
  // ------------------------
  async login(email: string, password: string) {
    if (!email || !password) {
      return { message: "Email and password are required" };
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return { message: "User not found" };
    }

    const isValid = user.password && await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { message: "Invalid password" };
    }

    await User.findByIdAndUpdate(user._id, {
      isLoggedIn: true,
      lastLoginAt: new Date(),
    }).exec();

    const token = jwt.sign(
      { id: user._id },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    return {
      message: "Login successful",
      token,
    };
  }

  // ------------------------
  // LOGOUT
  // ------------------------
  async logout(userId: string) {
    if (!userId) {
      return { message: "User ID is required" };
    }

    await User.findByIdAndUpdate(userId, {
      isLoggedIn: false,
      lastLogoutAt: new Date(),
    }).exec();

    return { message: "Logged out successfully" };
  }
}
