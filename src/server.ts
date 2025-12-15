// src/server.ts

import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

import app from "./app";
import connectDB from "./config/index";
import logger from "./logger";
import { seedRoles } from "./rbac/seed.roles";

const PORT = Number(process.env.PORT) || 4000;

// Validate .env
if (!process.env.MONGO_URI) {
  logger.error("❌ ERROR: MONGO_URI is missing in .env file.");
  process.exit(1);
}

const startServer = async () => {
  try {
    // ------------------------
    // Connect to MongoDB
    // ------------------------
    await connectDB();

    // ------------------------
    // Seed RBAC Roles
    // ------------------------
    await seedRoles();

    // ------------------------
    // Start Express Server
    // ------------------------
    app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error: any) {
    logger.error("❌ Failed to start server:");
    logger.error(error.message);
    process.exit(1);
  }
};

startServer();
