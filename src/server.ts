import "dotenv/config";

/* ============================================================
   CORE APP IMPORTS
============================================================ */

import app from "./app";
import connectDB from "./config/db"; // ✅ explicit DB module
import logger from "./logger";
import { seedRoles } from "./rbac/seed.roles";
import vendorRoutes from "./modules/vendor/vendor.routes";
import authRoutes from "./modules/auth/auth.routes";

/* ============================================================
   🔥 FORCE MODEL REGISTRATION (CRITICAL)
   These imports MUST execute before any route/controller
============================================================ */

import "./modules/orders/order.model";
import "./modules/menu/menu.model";

app.use("/api/vendor", vendorRoutes);
app.use("/api/auth", authRoutes);

/* ============================================================
   CONFIG
============================================================ */

const PORT = Number(process.env.PORT) || 4000;

/* ============================================================
   ENV VALIDATION (FAIL FAST)
============================================================ */

if (!process.env.MONGO_URI) {
  logger.error("❌ ERROR: MONGO_URI is missing in .env file.");
  process.exit(1);
}

/* ============================================================
   SERVER BOOTSTRAP
============================================================ */

async function startServer() {
  try {
    // 1️⃣ Connect to MongoDB
    await connectDB();

    // 2️⃣ Seed RBAC roles (idempotent)
    await seedRoles();

    // 3️⃣ Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error: any) {
    logger.error("❌ Failed to start server");
    logger.error(error?.message || error);
    process.exit(1);
  }
}

startServer();
