import { Schema, model, Types } from "mongoose";

/* ============================================================
   DRAFT ITEM
============================================================ */
const DraftItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: null },
    specifications: { type: Array, default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ============================================================
   DRAFT CATEGORY
============================================================ */
const DraftCategorySchema = new Schema(
  {
    category: { type: String, required: true },
    items: { type: [DraftItemSchema], required: true },
  },
  { _id: false }
);

/* ============================================================
   MENU DRAFT SNAPSHOT (AUTHORITATIVE)
============================================================ */
const MenuDraftSnapshotSchema = new Schema(
  {
    /* 🔗 OWNERSHIP */
    restaurantId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    /* 📄 SOURCE FILE (OCR INPUT) */
    sourceFile: {
      name: { type: String },
      mimeType: { type: String },
      url: { type: String },
    },

    /* 🧠 OCR RAW TEXT */
    rawText: {
      type: String,
      required: true,
    },

    /* 🗂 PARSED MENU STRUCTURE */
    mapping: {
      type: [DraftCategorySchema],
      required: true,
    },

    /* 🔄 LIFECYCLE */
    status: {
      type: String,
      enum: ["DRAFT", "COMMITTED"],
      default: "DRAFT",
      index: true,
    },

    /* 🔒 COMMIT METADATA (FORWARD COMPATIBLE) */
    committedAt: {
      type: Date,
      default: null,
    },

    committedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default model(
  "MenuDraftSnapshot",
  MenuDraftSnapshotSchema
);
