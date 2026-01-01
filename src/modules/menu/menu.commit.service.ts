// src/modules/menu/menu.commit.service.ts
import mongoose, { Types } from "mongoose";
import Item from "./item.model";
import MenuDraftSnapshot from "./menu.snapshot.model";
import { Category } from "./models/category.model";

const normalize = (v: string) => v.trim().toLowerCase();

type DraftItem = {
  name: string;
  price: number;
  available?: boolean;
};

type DraftCategory = {
  category: string;
  items: DraftItem[];
};

class MenuCommitService {
  async commitMapping({
    restaurantId,
    snapshotId,
    committedBy,
  }: {
    restaurantId: string;
    snapshotId: string;
    committedBy: string;
  }) {
    const session = await mongoose.startSession();
    let itemsCreated = 0;
    let itemsUpdated = 0;

    try {
      session.startTransaction();

      const snapshot = await MenuDraftSnapshot.findById(snapshotId).session(
        session
      );

      if (!snapshot) {
        throw new Error("Snapshot not found");
      }

      if (snapshot.committedAt) {
        throw new Error("Snapshot already committed");
      }

      if (snapshot.restaurantId.toString() !== restaurantId) {
        throw new Error("Restaurant mismatch");
      }

      const rid = new Types.ObjectId(restaurantId);

      const categories = await Category.find({
        restaurantId: rid,
        isVisible: true,
      }).session(session);

      const categoryByName = new Map(
        categories.map((c) => [normalize(c.name), c])
      );

      for (const cat of snapshot.mapping as DraftCategory[]) {
        const category = categoryByName.get(normalize(cat.category));
        if (!category) {
          throw new Error(`Category not found: ${cat.category}`);
        }

        for (const item of cat.items) {
          const normalizedName = normalize(item.name);
          const available =
            typeof item.available === "boolean" ? item.available : true;

          const existing = await Item.findOne({
            restaurantId: rid,
            normalizedName,
          }).session(session);

          if (existing) {
            existing.price = item.price;
            existing.available = available;
            existing.categoryId = category._id;
            await existing.save({ session });
            itemsUpdated++;
          } else {
            await Item.create(
              [
                {
                  restaurantId: rid,
                  categoryId: category._id,
                  name: item.name,
                  normalizedName,
                  price: item.price,
                  available,
                  source: "ocr",
                },
              ],
              { session }
            );
            itemsCreated++;
          }
        }
      }

      snapshot.committedAt = new Date();
      snapshot.committedBy = committedBy;
      await snapshot.save({ session });

      await session.commitTransaction();
      return { itemsCreated, itemsUpdated };
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}

export default new MenuCommitService();
