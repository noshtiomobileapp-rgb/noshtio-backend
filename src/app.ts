import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

/* ============================================================
   ROUTE IMPORTS
============================================================ */

// Auth
import authRoutes from "./modules/auth/auth.routes";

// Menu
import menuRoutes from "./modules/menu/menu.routes";
import qrRoutes from "./modules/menu/qr.routes";

// Vendor
import vendorRoutes from "./modules/vendor/vendor.routes";

// Customer
import customerRoutes from "./modules/customer/customer.routes";

// Orders
import vendorOrdersRoutes from "./routes/vendorOrders.routes";
import orderRoutes from "./modules/orders/order.routes";
import kitchenRoutes from "./modules/orders/order.kitchen.routes";

// Payments
import paymentRoutes from "./modules/payments/payment.routes";

// Analytics
import vendorAnalyticsRoutes from "./modules/menu/analytics/analytics.routes";

/* ============================================================
   ERROR MIDDLEWARE  (import last — used at the bottom)
============================================================ */
import { errorHandler } from "./middleware/error.middleware";

/* ============================================================
   APP INIT
============================================================ */

const app = express();

/* ============================================================
   CORS CONFIGURATION
============================================================ */

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
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ============================================================
   GLOBAL MIDDLEWARE
============================================================ */

app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

/* ============================================================
   HEALTH CHECK
   (before auth middleware so it never requires a token)
============================================================ */

app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    service: "Noshtio API",
    version: process.env.npm_package_version ?? "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

/* ============================================================
   PUBLIC ROUTES  (no auth required)
============================================================ */

// Auth — signup / login / refresh
app.use("/api/auth", authRoutes);

// Customer-facing menu (public — customers scan QR, no token)
app.use("/api/menu", menuRoutes);

/* ============================================================
   VENDOR PROTECTED ROUTES  (require JWT + vendor role)
============================================================ */

// Vendor profile & onboarding
app.use("/api/vendor", vendorRoutes);

// Vendor QR code management  ← NEW (Module 3)
app.use("/api/vendor/qr", qrRoutes);

// Vendor order management (accept / reject / view)
app.use("/api/vendor/orders", vendorOrdersRoutes);

// Vendor analytics dashboard
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);

/* ============================================================
   KITCHEN ROUTES  (require JWT + kitchen_staff or vendor_admin)
============================================================ */

// KOT screen — get active orders, advance status  ← NEW (Module 6)
app.use("/api/vendor/kitchen", kitchenRoutes);

/* ============================================================
   CUSTOMER ORDER ROUTES  (semi-public — customers place orders)
============================================================ */

// Place order, get order status  ← NEW (Module 5)
app.use("/api/orders", orderRoutes);

/* ============================================================
   CUSTOMER PROFILE ROUTES  (require JWT + customer role)
============================================================ */

// Customer profile management
app.use("/api/customers", customerRoutes);

/* ============================================================
   PAYMENT ROUTES  (Razorpay integration)
============================================================ */

// Payment creation, verification, and refunds
app.use("/api/payments", paymentRoutes);

/* ============================================================
   FALLBACK — 404
============================================================ */

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ============================================================
   GLOBAL ERROR HANDLER
   Must be LAST — Express identifies error middleware by 4 args
============================================================ */

app.use(errorHandler);

export default app;
