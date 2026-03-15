import { Request, Response } from "express";
import {
  getCustomerProfile,
  createCustomerProfile,
  updateCustomerProfile,
} from "./customer.service";

/* ============================================================
   GET CURRENT CUSTOMER PROFILE
   GET /api/customers/me

   Requires authentication - customer can only view their own
============================================================ */

export const getMyProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await getCustomerProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (err: any) {
    console.error("GET CUSTOMER PROFILE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load profile",
    });
  }
};

/* ============================================================
   CREATE CUSTOMER PROFILE
   POST /api/customers/profile

   Creates a new customer profile for authenticated user
============================================================ */

export const createProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { email, phone, firstName, lastName, address } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const profile = await createCustomerProfile({
      userId,
      email,
      phone,
      firstName,
      lastName,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "Customer profile created",
      data: profile,
    });
  } catch (err: any) {
    console.error("CREATE CUSTOMER PROFILE ERROR:", err);

    if (err.message.includes("already exists")) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user",
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create profile",
    });
  }
};

/* ============================================================
   UPDATE CUSTOMER PROFILE
   PUT /api/customers/profile

   Updates customer profile - authenticated user only
============================================================ */

export const updateProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { phone, firstName, lastName, address } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updated = await updateCustomerProfile(userId, {
      phone,
      firstName,
      lastName,
      address,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("UPDATE CUSTOMER PROFILE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to update profile",
    });
  }
};
