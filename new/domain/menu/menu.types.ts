import { ObjectId } from "mongoose";

export interface IMenu {
  _id?: ObjectId;
  name: string;
  description?: string;
  price?: number;
  categoryId?: ObjectId;
}
