import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

/* ============================================================
   REGISTER
============================================================ */

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const result = await authService.register(name, email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/* ============================================================
   LOGIN — 🔒 CONTRACT-CORRECT (FINAL)
============================================================ */

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    /**
     * AuthService.login() MUST return:
     * {
     *   token: string
     * }
     */
    const result = await authService.login(email, password);

    if (!result || !result.token) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // ✅ RETURN TOKEN IN RESPONSE (NON-NEGOTIABLE)
    return res.status(200).json({
      success: true,
      token: result.token,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/* ============================================================
   LOGOUT
============================================================ */

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;

    const result = await authService.logout(userId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
