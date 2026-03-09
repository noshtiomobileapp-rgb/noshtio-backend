import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

/* ============================================================
   ROUTE IMPORTS
============================================================ */

import authRoutes from "./modules/auth/auth.routes";
import menuRoutes from "./modules/menu/menu.routes";
import vendorRoutes from "./modules/vendor/vendor.routes";
import vendorOrdersRoutes from "./routes/vendorOrders.routes";
import vendorAnalyticsRoutes from "./modules/menu/analytics/analytics.routes";

const app = express();

/*
============================================================
   CORS CONFIGURATION
============================================================
*/

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://www.noshtio.com",
  "https://noshtio.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

/*
============================================================
   GLOBAL MIDDLEWARE
============================================================
*/

app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/*
============================================================
   API ROUTES
============================================================
*/

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);

/* 🔐 Vendor Protected APIs */
app.use("/api/vendor", vendorRoutes);

/* Vendor Orders */
app.use("/api/orders", vendorOrdersRoutes);

/* Vendor Analytics */
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);

/*
============================================================
   HEALTH CHECK
============================================================
*/

app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    service: "QRestro API",
    timestamp: new Date().toISOString(),
  });
});

/*
============================================================
   FALLBACK ROUTE (404 HANDLER)
============================================================
*/

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default app;