import { Request, Response } from "express";
import { getMenuByVendorId } from "./menu.customer.service";

/* ============================================================
   GET CUSTOMER MENU BY VENDOR ID
   GET /api/menu?vendorId=XXX

   Public endpoint - customers browse menus without auth
   Returns available items grouped by category
============================================================ */

export const getCustomerMenuHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { vendorId } = req.query;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "vendorId query parameter is required",
      });
    }

    if (typeof vendorId !== "string") {
      return res.status(400).json({
        success: false,
        message: "vendorId must be a string",
      });
    }

    const menu = await getMenuByVendorId(vendorId);

    return res.json({
      success: true,
      data: {
        vendorId,
        categories: menu,
        itemCount: menu.reduce((sum, cat) => sum + cat.items.length, 0),
      },
    });
  } catch (err: any) {
    console.error("GET CUSTOMER MENU ERROR:", err);

    if (err.message === "Invalid vendor ID") {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load menu",
    });
  }
};
