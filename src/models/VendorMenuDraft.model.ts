import { Schema, model, Types } from "mongoose";

/* ============================================================
   Types
============================================================ */

export interface VendorMenuDraftDocument {
  _id: Types.ObjectId;
  vendorId: Types.ObjectId;
  items: {
    name: string;
    price: number | null;
  }[];
  status: "DRAFT";
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   Schema
============================================================ */

const VendorMenuDraftSchema = new Schema<VendorMenuDraftDocument>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, default: null },
      },
    ],

    status: {
      type: String,
      enum: ["DRAFT"],
      default: "DRAFT",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   Model
============================================================ */

export const VendorMenuDraft = model<VendorMenuDraftDocument>(
  "VendorMenuDraft",
  VendorMenuDraftSchema
);
