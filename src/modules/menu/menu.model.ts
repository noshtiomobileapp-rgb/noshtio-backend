import mongoose, { Schema, Document } from "mongoose";

/* ============================================================
   TYPES
============================================================ */

export interface MenuDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   SCHEMA
============================================================ */

const MenuSchema = new Schema<MenuDocument>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   MODEL REGISTRATION (CRITICAL)
============================================================ */

export const Menu =
  mongoose.models.Menu || mongoose.model<MenuDocument>("Menu", MenuSchema);

export default Menu;
