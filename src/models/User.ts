// src/models/User.ts

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  password: String,

  isLoggedIn: { type: Boolean, default: false },
  lastLoginAt: { type: Date },
  lastLogoutAt: { type: Date },
});

export const User = mongoose.model("User", userSchema);
