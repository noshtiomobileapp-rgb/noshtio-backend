import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * 🔒 Backend v1.1
 * Step 4.3 — Availability added
 */

export interface IItemSpecification {
  name: string;
  price: number;
}

export interface IItem extends Document {
  name: string;
  price?: number | null;
  specifications?: IItemSpecification[];
  categoryId?: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSpecificationSchema = new Schema<IItemSpecification>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: null },
    specifications: { type: [ItemSpecificationSchema], default: [] },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ItemSchema.index({ restaurantId: 1, categoryId: 1 });
ItemSchema.index({ name: "text" });

export const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);

export default Item;
