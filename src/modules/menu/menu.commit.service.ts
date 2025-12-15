import { Types } from "mongoose";
import { Category } from "./models/category.model";
import Item, { IItem } from "./models/item.model";

export interface ApprovedItemInput {
  name: string;
  price?: number | null;
  matchedItemId?: string | null;
}

export interface ApprovedCategoryInput {
  category: string;
  items: ApprovedItemInput[];
}

export interface CommitPayload {
  restaurantId: string | Types.ObjectId;
  mapping: ApprovedCategoryInput[];
}

export class MenuCommitService {
  async upsertCategory(
    restaurantId: string | Types.ObjectId,
    categoryName: string
  ) {
    const normalized = categoryName.trim().toLowerCase();

    const existing = await Category.findOne({
      restaurantId,
      name: { $regex: new RegExp("^" + normalized + "$", "i") },
    });

    if (existing) return existing;

    return await Category.create({
      restaurantId,
      name: categoryName.trim(),
    });
  }

  async upsertItem(
    restaurantId: string | Types.ObjectId,
    categoryId: Types.ObjectId,
    item: ApprovedItemInput
  ) {
    if (item.matchedItemId) {
      const existing = await Item.findOne({
        _id: item.matchedItemId,
        restaurantId,
      });

      if (existing) {
        existing.price = item.price ?? existing.price;
        existing.categoryId = categoryId;
        return await existing.save();
      }
    }

    const normalized = item.name.trim().toLowerCase();

    let existingByName = await Item.findOne({
      restaurantId,
      name: { $regex: new RegExp("^" + normalized + "$", "i") },
    });

    if (existingByName) {
      existingByName.price = item.price ?? existingByName.price;
      existingByName.categoryId = categoryId;
      return await existingByName.save();
    }

    return await Item.create({
      restaurantId,
      categoryId,
      name: item.name.trim(),
      price: item.price ?? null,
    });
  }

  async commitMapping(payload: CommitPayload) {
    const restaurantId = new Types.ObjectId(payload.restaurantId);

    const finalCategories: any[] = [];

    for (const cat of payload.mapping) {
      const categoryDoc = await this.upsertCategory(restaurantId, cat.category);

      const savedItems: any[] = [];

      for (const item of cat.items) {
        const savedItem = await this.upsertItem(
          restaurantId,
          categoryDoc._id,
          item
        );

        savedItems.push({
          _id: savedItem._id,
          name: savedItem.name,
          price: savedItem.price,
        });
      }

      finalCategories.push({
        _id: categoryDoc._id,
        name: categoryDoc.name,
        items: savedItems,
      });
    }

    return {
      restaurantId,
      categories: finalCategories,
      message: "Mapping committed successfully",
    };
  }
}

export default new MenuCommitService();
