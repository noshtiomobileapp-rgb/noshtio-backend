import express from "express";
import cors from "cors";
import morgan from "morgan";
// 🔥 FORCE MODULE EXECUTION
import ocrRoutes from "./modules/ocr";

// ------------------------
// Import Route Modules
// ------------------------
import authRoutes from "./modules/auth/auth.routes";
import protectedRoutes from "./modules/example/protected.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/orders/order.routes";

// Vendor Orders
import vendorOrdersRoutes from "./routes/vendorOrders.routes";

// Menu OCR Upload
import menuUploadRoutes from "./routes/menu.upload.routes";

// ✅ Vendor Analytics (FIX)
import vendorAnalyticsRoutes from "./modules/menu/analytics/analytics.routes";

// ------------------------
// Initialize Express App
// ------------------------
const app = express();

// ------------------------
// Global Middlewares
// ------------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/api/ocr", ocrRoutes);

// ------------------------
// Request Logging (Debug)
// ------------------------
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ------------------------
// Mount API Routes
// ------------------------
app.use("/api/auth", authRoutes);
app.use("/api/example", protectedRoutes);

// ✅ VENDOR MENU
app.use("/api/vendor/menu", menuRoutes);
app.use("/api/vendor/menu", menuUploadRoutes);

// ✅ VENDOR ANALYTICS (🔥 THIS WAS MISSING)
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);

// ✅ CUSTOMER ORDERS
app.use("/api/customer/orders", orderRoutes);

// ✅ VENDOR ORDERS
app.use("/api/vendor", vendorOrdersRoutes);

// ------------------------
// Health Check
// ------------------------
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

export default app;
