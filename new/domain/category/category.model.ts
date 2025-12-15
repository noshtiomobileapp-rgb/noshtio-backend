import { Schema, model } from "mongoose";
import { ICategory } from "./category.types";

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    description: String,
  },
  { timestamps: true }
);

export const CategoryModel = model<ICategory>("Category", CategorySchema);
