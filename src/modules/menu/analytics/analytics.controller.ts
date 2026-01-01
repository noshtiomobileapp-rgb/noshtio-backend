// 🔥 FORCE SCHEMA EXECUTION (ABSOLUTE GUARANTEE)
import "../../orders/order.model";
import "../menu.model";

import { Request, Response } from "express";
import mongoose, { Model } from "mongoose";

/* ============================================================
   GLOBAL MODELS
============================================================ */

const Order = mongoose.model("Order") as Model<any>;
const Menu = mongoose.model("Menu") as Model<any>;

/* ============================================================
   CONSTANTS (MVP LOCKED)
============================================================ */

const VALID_REVENUE_STATUSES = ["COMPLETED"] as const;

/* ============================================================
   TYPES
============================================================ */

type SummaryAgg = {
  _id: null;
  totalOrders: number;
  totalRevenue: number;
};

type MenuCountAgg = {
  _id: null;
  menuCount: number;
};

/* ============================================================
   HELPERS
============================================================ */

function startDateForRange(range: 7 | 30): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (range - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/* ============================================================
   VENDOR ANALYTICS SUMMARY — MVP FINAL
============================================================ */

export const getVendorAnalyticsSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user?.tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const tenantId = new mongoose.Types.ObjectId(user.tenantId);
    const range: 7 | 30 = Number(req.query.range) === 30 ? 30 : 7;
    const startDate = startDateForRange(range);

    const [summaryAgg = [], menuCountAgg = []] = await Promise.all([
      Order.aggregate<SummaryAgg>([
        {
          $match: {
            tenantId,
            createdAt: { $gte: startDate },
            status: { $in: VALID_REVENUE_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Menu.aggregate<MenuCountAgg>([
        { $match: { vendorId: tenantId } },
        { $unwind: "$categories" },
        { $unwind: "$categories.items" },
        {
          $group: {
            _id: null,
            menuCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        totalOrders: Number(summaryAgg[0]?.totalOrders ?? 0),
        totalRevenue: Number(summaryAgg[0]?.totalRevenue ?? 0),
        menuCount: Number(menuCountAgg[0]?.menuCount ?? 0),
      },
    });
  } catch (err) {
    console.error("[Vendor Analytics Error]", err);
    return res.status(500).json({
      success: false,
      message: "Analytics computation failed",
    });
  }
};
