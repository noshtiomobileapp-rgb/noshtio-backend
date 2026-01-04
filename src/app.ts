import express from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";

/* ============================================================
   FORCE MODULE EXECUTION (SIDE-EFFECT IMPORTS)
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
   CORS — PRODUCTION SAFE (RENDER + BROWSER)
============================================================ */
const ALLOWED_ORIGINS: string[] = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://www.noshtio.com",
  "https://noshtio.com",
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

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
};

app.use(cors(corsOptions));

// 🔥 REQUIRED: Browser preflight support (Render safe)
app.options("*", cors(corsOptions));

/* ============================================================
   GLOBAL MIDDLEWARES
============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ============================================================
   REQUEST LOGGING (DEBUG — SAFE)
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
   HEALTH CHECK (RENDER)
============================================================ */
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
  });
});

export default app;
