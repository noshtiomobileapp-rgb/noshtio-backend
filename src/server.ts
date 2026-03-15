/* ============================================================
   ENV LOADING — MUST BE FIRST
============================================================ */
import dotenv from "dotenv";
dotenv.config();

/* ============================================================
   CORE IMPORTS
============================================================ */
import app from "./app";
import connectDB from "./config/db";
import logger from "./logger";
import { seedRoles } from "./rbac/seed.roles";

/* ============================================================
   FORCE MODEL REGISTRATION (DO NOT REMOVE)
============================================================ */
import "./modules/orders/order.model";
import "./modules/menu/menu.model";

/* ============================================================
   CONFIG
============================================================ */
const PORT = Number(process.env.PORT) || 4000;

/* ============================================================
   ENV VALIDATION (FAIL FAST)
============================================================ */
if (!process.env.MONGO_URI) {
  logger.error("❌ ERROR: MONGO_URI is missing");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  logger.error("❌ ERROR: JWT_SECRET is missing");
  process.exit(1);
}

/* ============================================================
   SERVER BOOTSTRAP
============================================================ */
async function startServer() {
  try {
    await connectDB();
    await seedRoles();
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(
        `🔐 JWT_SECRET loaded: ${process.env.JWT_SECRET?.slice(0, 6)}******`
      );
    });
  } catch (error: any) {
    logger.error("❌ Server startup failed");
    logger.error(error?.message || error);
    process.exit(1);
  }
}

startServer();