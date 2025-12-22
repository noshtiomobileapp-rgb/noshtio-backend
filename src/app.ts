import express from "express";
import cors from "cors";
import morgan from "morgan";

// ------------------------
// Import Route Modules
// ------------------------
import authRoutes from "./modules/auth/auth.routes";
import protectedRoutes from "./modules/example/protected.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/orders/order.routes";

// Vendor Orders (existing)
import vendorOrdersRoutes from "./routes/vendorOrders.routes";

// ✅ NEW: Vendor Categories
import categoryRoutes from "./modules/categories/category.routes";

// ------------------------
// Initialize Express App
// ------------------------
const app = express();

// ------------------------
// Global Middlewares
// ------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

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
app.use("/api/menu", menuRoutes);

// ✅ SINGLE SOURCE OF TRUTH FOR CUSTOMER ORDERS
app.use("/api/customer/orders", orderRoutes);

// ✅ VENDOR ORDERS (READ-ONLY, MVP)
app.use("/api/vendor", vendorOrdersRoutes);

// ✅ VENDOR CATEGORIES (THIS WAS MISSING)
app.use("/api/vendor/categories", categoryRoutes);

// ------------------------
// Health Check
// ------------------------
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

// ------------------------
// Export App
// ------------------------
export default app;
