import { ObjectId } from "mongoose";

export interface IMenu {
  _id?: ObjectId;
  name: string;
  description?: string;
  price?: number;
  categoryId?: ObjectId;
}
import { MenuModel } from "./menu.model";

/** Menu Type Definition */
export interface IMenu {
  _id?: ObjectId;
  name: string;
  description?: string;
  price?: number;
  categoryId?: ObjectId;
}

/** Menu Service */
export class MenuService {
  /** Get all menu items, with category populated */
  async findAll() {
    return MenuModel.find().populate("categoryId");
  }

  /** Get a single menu item by ID, with category populated */
  async findById(id: string) {
    return MenuModel.findById(id).populate("categoryId");
  }

  /** Create new menu item */
  async create(data: IMenu) {
    return MenuModel.create(data);
  }

  /** Update menu item */
  async update(id: string, data: Partial<IMenu>) {
    return MenuModel.findByIdAndUpdate(id, data, { new: true });
  }

  /** Delete menu item */
  async delete(id: string) {
    return MenuModel.findByIdAndDelete(id);
  }

  /** Used by OCR pipeline to bulk insert items */
  async createFromOCR(items: IMenu[]) {
    // You can change to `upsert` logic later to avoid duplicates.
    return MenuModel.insertMany(items);
  }
}
