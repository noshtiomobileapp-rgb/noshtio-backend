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
   MENU DRAFT SNAPSHOT
============================================================ */
const MenuDraftSnapshotSchema = new Schema(
  {
    restaurantId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    sourceFile: {
      name: String,
      mimeType: String,
      url: String,
    },

    rawText: {
      type: String,
      required: true,
    },

    mapping: {
      type: [DraftCategorySchema],
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "COMMITTED"],
      default: "DRAFT",
    },

    /* COMMIT COMPATIBILITY */
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
