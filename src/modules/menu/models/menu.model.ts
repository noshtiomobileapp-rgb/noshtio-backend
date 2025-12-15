import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMenuItem {
  name: string;
  price?: number | null;
}

export interface IMenuCategory {
  name: string;
  items: IMenuItem[];
}

export interface IMenu extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categories: IMenuCategory[];
  rawText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: null },
  },
  { _id: false }
);

const MenuCategorySchema = new Schema<IMenuCategory>(
  {
    name: { type: String, required: true, trim: true },
    items: { type: [MenuItemSchema], default: [] },
  },
  { _id: false }
);

const MenuSchema = new Schema<IMenu>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    categories: { type: [MenuCategorySchema], default: [] },
    rawText: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Menu: Model<IMenu> =
  mongoose.models.Menu || mongoose.model<IMenu>("Menu", MenuSchema);

export default Menu;
