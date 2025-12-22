import mongoose from "mongoose";
/**
 * 🔒 LOCKED — Backend v1.0
 * Category schema is frozen.
 * DO NOT modify without version bump.
 */

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
