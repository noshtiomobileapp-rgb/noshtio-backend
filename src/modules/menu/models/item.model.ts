import mongoose, { Schema, Document, Model } from "mongoose";

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
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
  },
  { timestamps: true }
);

ItemSchema.index({ name: "text" });

export const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);

export default Item;
