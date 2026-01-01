// src/config/db.ts

import mongoose from "mongoose";

/* ============================================================
   MongoDB Connection
   - Reads env vars ONLY at runtime
   - No side effects at import time
   - Fails fast with clear logs
============================================================ */

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: true, // safe for dev; disable in prod if needed
    });

    console.log("✅ Connected to MongoDB");
  } catch (error: any) {
    console.error("❌ MongoDB connection failed");
    console.error(error?.message || error);
    process.exit(1);
  }
};

export default connectDB;
