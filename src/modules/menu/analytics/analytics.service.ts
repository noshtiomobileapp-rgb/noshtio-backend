import mongoose from "mongoose";
import { OrderModel } from "../../orders/order.model";

export async function getVendorAnalytics(
  tenantId: mongoose.Types.ObjectId,
  range: 7 | 30
) {
  const since = new Date();
  since.setDate(since.getDate() - range);

  /* ===============================
     SUMMARY
  =============================== */

  const summaryAgg = await OrderModel.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: since },
        status: { $ne: "CANCELLED" },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
      },
    },
  ]);

  const totalOrders = summaryAgg[0]?.totalOrders ?? 0;
  const totalRevenue = summaryAgg[0]?.totalRevenue ?? 0;

  /* ===============================
     ORDERS PER DAY
  =============================== */

  const ordersPerDay = await OrderModel.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        orders: 1,
      },
    },
  ]);

  /* ===============================
     TOP ITEMS
  =============================== */

  const topItems = await OrderModel.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: since },
        status: { $ne: "CANCELLED" },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        qty: { $sum: "$items.qty" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        name: "$_id",
        qty: 1,
        revenue: 1,
      },
    },
  ]);

  /* ===============================
     STATUS DISTRIBUTION
  =============================== */

  const statusAgg = await OrderModel.aggregate([
    {
      $match: {
        tenantId,
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statusDistribution: Record<string, number> = {};
  for (const row of statusAgg) {
    statusDistribution[row._id] = row.count;
  }

  return {
    range,
    summary: {
      totalOrders,
      totalRevenue,
      averageOrderValue:
        totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    ordersPerDay,
    topItems,
    statusDistribution,
  };
}
