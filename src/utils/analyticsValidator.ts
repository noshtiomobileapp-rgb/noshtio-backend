/* ============================================================
   Analytics Sanity Validator
   - Safe in dev & prod
   - Non-blocking (warns only)
============================================================ */

export type AnalyticsPayload = {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  ordersPerDay: {
    date: string;
    orders: number;
  }[];
};

export function validateAnalytics(data: AnalyticsPayload) {
  if (!data || !data.summary || !Array.isArray(data.ordersPerDay)) {
    console.warn("[Analytics Warning] Invalid analytics payload");
    return;
  }

  const totalFromDays = data.ordersPerDay.reduce(
    (sum, d) => sum + (d.orders || 0),
    0
  );

  if (totalFromDays !== data.summary.totalOrders) {
    console.warn(
      "[Analytics Warning] totalOrders mismatch",
      {
        fromDays: totalFromDays,
        summary: data.summary.totalOrders,
      }
    );
  }

  if (
    data.summary.totalOrders > 0 &&
    data.summary.averageOrderValue <= 0
  ) {
    console.warn(
      "[Analytics Warning] averageOrderValue is invalid",
      data.summary.averageOrderValue
    );
  }
}
