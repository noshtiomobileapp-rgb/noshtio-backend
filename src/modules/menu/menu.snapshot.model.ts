import { Schema, model, Types } from "mongoose";

/* ============================================================
   Draft Item (STEP 4.3: availability added, backward-safe)
============================================================ */
const DraftItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: null },
    specifications: { type: Array, default: [] },

    // STEP 4.3
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

/* ============================================================
   Draft Category
============================================================ */
const DraftCategorySchema = new Schema(
  {
    category: { type: String, required: true },
    categoryId: { type: Types.ObjectId, default: null },
    items: { type: [DraftItemSchema], required: true },
    evidence: { type: [String], default: [] },
  },
  { _id: false }
);

/* ============================================================
   Snapshot
============================================================ */
const MenuDraftSnapshotSchema = new Schema(
  {
    restaurantId: {
      type: Types.ObjectId,
      required: true,
      index: true,
    },

    mapping: {
      type: [DraftCategorySchema],
      required: true,
    },

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
