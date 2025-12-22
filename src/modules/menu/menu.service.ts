// src/modules/menu/menu.service.ts
import Menu from "./menu.model";

export interface ParsedMenuCategory {
  name: string;
  items: {
    name: string;
    price?: number | null;
    description?: string;
  }[];
}

export default class MenuService {
  async saveMenu(vendorId: string, menu: { categories: ParsedMenuCategory[] }) {
    const categories = Array.isArray(menu?.categories)
      ? menu.categories.map((c) => ({
          name: c.name,
          items: Array.isArray(c.items)
            ? c.items.map((i) => ({
                name: i.name,
                price: i.price ?? null,
                description: i.description ?? "",
              }))
            : [],
        }))
      : [];

    return Menu.findOneAndUpdate(
      { vendorId },
      { vendorId, categories, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }

  async createManualMenu({
    vendorId,
    categoryName,
    itemName,
    price,
    description,
  }: {
    vendorId: string;
    categoryName: string;
    itemName: string;
    price?: number;
    description?: string;
  }) {
    return Menu.create({
      vendorId,
      categories: [
        {
          name: categoryName,
          items: [{ name: itemName, price, description }],
        },
      ],
    });
  }

  async getMenu(vendorId: string) {
    return Menu.findOne({ vendorId });
  }

  async getMenuByRestaurant(restaurantId: string) {
    return Menu.findOne({ restaurantId });
  }
}
