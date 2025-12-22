// src/modules/menu/menu.commit.service.ts
import mongoose, { Types } from "mongoose";
import Item from "./item.model";
import MenuDraftSnapshot from "./menu.snapshot.model";
import { Category } from "./models/category.model";

const normalize = (v: string) => v.trim().toLowerCase();

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
      if (!snapshot) throw new Error("Snapshot not found");

      const rid = new Types.ObjectId(restaurantId);

      const categories = await Category.find({
        restaurantId: rid,
        isVisible: true,
      }).session(session);

      const categoryByName = new Map(
        categories.map((c) => [normalize(c.name), c])
      );

      for (const cat of snapshot.mapping as any[]) {
        const category = categoryByName.get(normalize(cat.category));
        if (!category) continue;

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
