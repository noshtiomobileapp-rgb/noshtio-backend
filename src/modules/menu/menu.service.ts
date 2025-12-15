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
  /* ============================================================
     SAVE OCR OR EDITED MENU (OVERWRITE MODE)
     ============================================================ */
  async saveMenu(vendorId: string, menu: { categories: ParsedMenuCategory[] }) {
    const categories = Array.isArray(menu?.categories)
      ? menu.categories.map((c: any) => ({
          name: c.name,
          items: Array.isArray(c.items)
            ? c.items.map((i: any) => ({
                name: i.name,
                price: i.price ?? null,
                description: i.description ?? "",
              }))
            : [],
        }))
      : [];

    return await Menu.findOneAndUpdate(
      { vendorId },
      { vendorId, categories, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /* ============================================================
     MANUAL MENU CREATION
     ============================================================ */
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
    return await Menu.create({
      vendorId,
      categories: [
        {
          name: categoryName,
          items: [{ name: itemName, price, description }],
        },
      ],
    });
  }

  /* ============================================================
     ADD CATEGORY (TS SAFE)
     ============================================================ */
  async addCategory(vendorId: string, categoryName: string) {
    const menu = await Menu.findOne({ vendorId });

    if (!menu) {
      return await Menu.create({
        vendorId,
        categories: [{ name: categoryName, items: [] }],
      });
    }

    // TS-safe fix: DocumentArray must be reset using menu.set(...)
    if (!Array.isArray(menu.categories)) {
      menu.set("categories", [] as any);
    }

    menu.categories.push({ name: categoryName, items: [] } as any);
    return await menu.save();
  }

  /* ============================================================
     ADD ITEM TO CATEGORY (TS SAFE)
     ============================================================ */
  async addItem(
    vendorId: string,
    categoryName: string,
    item: { name: string; price?: number | null; description?: string }
  ) {
    const menu = await Menu.findOne({ vendorId });

    if (!menu) {
      return await Menu.create({
        vendorId,
        categories: [
          {
            name: categoryName,
            items: [item],
          },
        ],
      });
    }

    if (!Array.isArray(menu.categories)) {
      menu.set("categories", [] as any);
    }

    let category = (menu.categories as any[]).find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      category = { name: categoryName, items: [] } as any;
      (menu.categories as any[]).push(category);
    }

    if (!Array.isArray(category.items)) {
      category.items = [];
    }

    (category.items as any[]).push(item as any);

    return await menu.save();
  }

  /* ============================================================
     MERGE OCR MENU INTO EXISTING MENU
     ============================================================ */
  async mergeMenu(vendorId: string, ocrMenu: ParsedMenuCategory[]) {
    const menu = await Menu.findOne({ vendorId });

    if (!menu) {
      return await Menu.create({ vendorId, categories: ocrMenu });
    }

    if (!Array.isArray(menu.categories)) {
      menu.set("categories", [] as any);
    }

    for (const newCat of ocrMenu) {
      let existing = (menu.categories as any[]).find(
        (c) => c.name.toLowerCase() === newCat.name.toLowerCase()
      );

      if (!existing) {
        (menu.categories as any[]).push(newCat as any);
        continue;
      }

      for (const item of newCat.items) {
        const exists = (existing.items as any[]).some(
          (i) => i.name.toLowerCase() === item.name.toLowerCase()
        );
        if (!exists) {
          (existing.items as any[]).push(item as any);
        }
      }
    }

    return await menu.save();
  }

  /* ============================================================
     GET MENU
     ============================================================ */
  async getMenu(vendorId: string) {
    return await Menu.findOne({ vendorId });
  }
}
