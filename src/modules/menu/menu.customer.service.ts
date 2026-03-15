import mongoose from "mongoose";
import Item from "./item.model";
import { Category } from "./models/category.model";

/* ============================================================
   GET CUSTOMER MENU BY VENDOR ID
   Returns all available items grouped by category
============================================================ */

export interface CustomerMenuCategory {
  categoryId: string;
  categoryName: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
    imageAlt?: string;
  }>;
}

export async function getMenuByVendorId(
  vendorId: string
): Promise<CustomerMenuCategory[]> {
  // Validate vendorId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new Error("Invalid vendor ID");
  }

  const rid = new mongoose.Types.ObjectId(vendorId);

  // Fetch all available items for this vendor
  const items = await Item.find({
    restaurantId: rid,
    available: true,
  })
    .select("categoryId name price description image imageAlt")
    .lean();

  if (items.length === 0) {
    return [];
  }

  // Fetch all categories for this vendor
  const categoryIds = [...new Set(items.map((item: any) => item.categoryId.toString()))];
  const categories = await Category.find({
    _id: { $in: categoryIds },
  })
    .select("_id name")
    .lean();

  // Create category lookup map
  const categoryMap = new Map(
    categories.map((cat: any) => [cat._id.toString(), cat.name])
  );

  // Group items by category
  const groupedByCategory = new Map<string, any[]>();

  items.forEach((item: any) => {
    const categoryId = item.categoryId.toString();
    if (!groupedByCategory.has(categoryId)) {
      groupedByCategory.set(categoryId, []);
    }
    groupedByCategory.get(categoryId)!.push(item);
  });

  // Build response
  const result: CustomerMenuCategory[] = [];

  groupedByCategory.forEach((items, categoryId) => {
    const categoryName = categoryMap.get(categoryId) || "Uncategorized";
    result.push({
      categoryId,
      categoryName,
      items: items.map((item: any) => ({
        itemId: item._id.toString(),
        name: item.name,
        price: item.price,
        description: item.description || undefined,
        image: item.image || undefined,
        imageAlt: item.imageAlt || undefined,
      })),
    });
  });

  return result;
}
