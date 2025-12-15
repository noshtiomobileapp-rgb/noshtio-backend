// src/modules/menu/item.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IItem extends Document {
  name: string;
  price: number;
  description?: string;
  category?: mongoose.Types.ObjectId;
  available: boolean;
  image?: string;    // S3 URL
  imageAlt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, default: 0 },
    description: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    available: { type: Boolean, default: true },
    image: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models?.Item || mongoose.model<IItem>("Item", ItemSchema);
