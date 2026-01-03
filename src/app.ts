import express from "express";
import cors from "cors";
import morgan from "morgan";

/* ============================================================
   FORCE MODULE EXECUTION
============================================================ */
import ocrRoutes from "./modules/ocr";

/* ============================================================
   ROUTES
============================================================ */
import authRoutes from "./modules/auth/auth.routes";
import protectedRoutes from "./modules/example/protected.routes";
import menuRoutes from "./modules/menu/menu.routes";
import orderRoutes from "./modules/orders/order.routes";
import vendorOrdersRoutes from "./routes/vendorOrders.routes";
import menuUploadRoutes from "./routes/menu.upload.routes";
import vendorAnalyticsRoutes from "./modules/menu/analytics/analytics.routes";

/* ============================================================
   INIT APP
============================================================ */
const app = express();

/* ============================================================
   CORS — PRODUCTION SAFE (CRITICAL)
============================================================ */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://www.noshtio.com",
  "https://noshtio.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server & tools like curl/postman
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// 🔥 REQUIRED FOR BROWSER PREFLIGHT (RENDER SAFE)
app.options("*", cors());

/* ============================================================
   GLOBAL MIDDLEWARES
============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ============================================================
   REQUEST LOGGING (DEBUG)
============================================================ */
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

/* ============================================================
   ROUTE MOUNTS
============================================================ */
app.use("/api/ocr", ocrRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/example", protectedRoutes);

// VENDOR
app.use("/api/vendor/menu", menuRoutes);
app.use("/api/vendor/menu", menuUploadRoutes);
app.use("/api/vendor/analytics", vendorAnalyticsRoutes);
app.use("/api/vendor", vendorOrdersRoutes);

// CUSTOMER
app.use("/api/customer/orders", orderRoutes);

/* ============================================================
   HEALTH CHECK
============================================================ */
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

export default app;
