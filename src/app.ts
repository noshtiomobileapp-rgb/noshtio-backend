import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes";
import menuRoutes from "./modules/menu/menu.routes";
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
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"));
    },
    credentials: true, // REQUIRED for cookies
  })
);

/*
============================================================
   GLOBAL MIDDLEWARE (ORDER IS CRITICAL)
============================================================
*/
app.use(cookieParser()); // MUST be before routes to read auth_token
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/*
============================================================
   ROUTE MOUNTING
============================================================
*/
app.use("/api/auth", authRoutes);
app.use("/api/vendor/menu", menuRoutes);
app.use("/api/vendor", vendorOrdersRoutes);
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "OK", service: "QRestro API" });
});

export default app;