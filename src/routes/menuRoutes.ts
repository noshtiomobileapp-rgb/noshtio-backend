// src/modules/menu/models/menu.model.ts
import mongoose, { Document, Model } from "mongoose";

export interface IMenuItem extends Document {
  name: string;
  price: number;
  category?: string;
}

const MenuSchema = new mongoose.Schema<IMenuItem>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String },
}, { timestamps: true });

const Menu: Model<IMenuItem> = mongoose.models.Menu || mongoose.model<IMenuItem>("Menu", MenuSchema);

export default Menu;
