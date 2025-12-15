// src/app.ts

import express from "express";
import cors from "cors";
import morgan from "morgan";

// ------------------------
// Import Route Modules
// ------------------------
import authRoutes from "./modules/auth/auth.routes";
import protectedRoutes from "./modules/example/protected.routes";

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
// Request Logging
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
