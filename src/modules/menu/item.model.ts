// src/modules/menu/item.model.ts

import mongoose, { Document, Schema } from "mongoose";

/* ============================================================
   Interface
   ============================================================ */

export interface IItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;

  name: string;
  normalizedName: string;

  price: number;
  description?: string;

  /** Vendor-controlled visibility */
  available: boolean;

  image?: string;
  imageAlt?: string;

  source?: "manual" | "ocr";

  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   Schema
   ============================================================ */

const ItemSchema = new Schema<IItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
    },

    /* ========================================================
       Availability Toggle (ON / OFF)
       ======================================================== */
    available: {
      type: Boolean,
      default: true,
      index: true, // IMPORTANT: fast filtering for public menu
    },

    image: {
      type: String,
      default: "",
    },

    imageAlt: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["manual", "ocr"],
      default: "manual",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   Indexes
   ============================================================ */

/**
 * Prevent duplicate items per restaurant
 * (case-insensitive via normalizedName)
 */
ItemSchema.index(
  { restaurantId: 1, normalizedName: 1 },
  { unique: true }
);

/**
 * Fast public menu lookup:
 * restaurantId + available
 */
ItemSchema.index(
  { restaurantId: 1, available: 1 }
);

/* ============================================================
   Export
   ============================================================ */

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", ItemSchema);
