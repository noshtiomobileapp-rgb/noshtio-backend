import { Schema, model } from "mongoose";
import { IMenu } from "./menu.types";

const MenuSchema = new Schema<IMenu>(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" }
  },
  { timestamps: true }
);

export const MenuModel = model<IMenu>("Menu", MenuSchema);
