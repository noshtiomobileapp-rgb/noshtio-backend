// src/modules/menu/item.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string;
  price: number;
  description?: string;
  available: boolean;
  image?: string;
  imageAlt?: string;
  source?: "manual" | "ocr";
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema(
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

    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, index: true },

    price: { type: Number, required: true },

    description: { type: String, default: "" },

    available: { type: Boolean, default: true },

    image: { type: String, default: "" },
    imageAlt: { type: String, default: "" },

    source: { type: String, enum: ["manual", "ocr"], default: "manual" },
  },
  { timestamps: true }
);

ItemSchema.index(
  { restaurantId: 1, normalizedName: 1 },
  { unique: true }
);

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", ItemSchema);
