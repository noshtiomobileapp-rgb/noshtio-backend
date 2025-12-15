import { Schema, model, Types } from "mongoose";

const MenuItemSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String
});

const CategorySchema = new Schema({
  name: String,
  items: [MenuItemSchema]
});

const MenuSchema = new Schema({
  vendorId: { type: Types.ObjectId, ref: "Vendor", required: true },
  categories: [CategorySchema],
  createdAt: { type: Date, default: Date.now }
});

export default model("Menu", MenuSchema);
