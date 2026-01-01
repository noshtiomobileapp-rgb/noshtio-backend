// src/modules/menu/menu.mapper.ts

import CATEGORY_KEYWORDS from "./categoryKeywords";
import { buildFuseIndex } from "./fuzzy.util";
import { Item, IItem } from "./models/item.model";
import { Category } from "./models/category.model";
import { Types } from "mongoose";
import { ParsedMenuShape } from "./ocr.types";

/**
 * MappingResult: what uploadOCR returns to the frontend and to save routine.
 */
export type MappingResult = {
  category: string;
  categoryId?: string;
  items: Array<{
    name: string;
    specifications?: Array<{ name: string; price: number }>;
    price?: number | null;

    // STEP 4.3
    isAvailable?: boolean;

    matchedItemId?: string | null;
    matchedItemName?: string | null;
    score?: number | null;
    method: "keyword" | "exact" | "fuzzy" | "none";
  }>;
  evidence?: string[];
};

const SPEC_TOKEN_REGEX = new RegExp(
  "\\b(" +
    [
      "quarter",
      "half",
      "full",
      "small",
      "medium",
      "large",
      "regular",
      "plate",
      "serving",
      "piece",
      "pcs?",
      "pc",
      "\\d+pc",
      "\\d+pcs",
      "\\d+ ?g",
      "\\d+ ?kg",
    ].join("|") +
    ")\\b$",
  "i"
);

function extractBaseAndSpec(
  name: string
): { base: string; spec?: string } {
  if (!name || !name.trim()) return { base: name };
  const trimmed = name.trim();

  const match = trimmed.match(SPEC_TOKEN_REGEX);
  if (match && match.index !== undefined) {
    const spec = match[0].trim();
    const base = trimmed.slice(0, match.index).trim();
    return { base: base || trimmed, spec };
  }

  const dashParts = trimmed.split(/\s*[-–—]\s*/);
  if (dashParts.length > 1) {
    const last = dashParts[dashParts.length - 1];
    if (SPEC_TOKEN_REGEX.test(last)) {
      const base = dashParts.slice(0, -1).join(" - ").trim();
      return { base: base || trimmed, spec: last.trim() };
    }
  }

  return { base: trimmed };
}

export async function mapParsedMenuToCategories(
  parsed: ParsedMenuShape,
  options?: {
    restaurantId?: string | Types.ObjectId;
    fuzzyThreshold?: number;
  }
): Promise<MappingResult[]> {
  const restaurantId = options?.restaurantId
    ? new Types.ObjectId(String(options.restaurantId))
    : null;

  const fuzzyThreshold = options?.fuzzyThreshold ?? 0.4;

  const itemQuery: Record<string, unknown> = {};
  if (restaurantId) itemQuery.restaurantId = restaurantId;

  const allItems = await Item.find(itemQuery).lean<IItem[]>().exec();

  const fuse = buildFuseIndex<IItem>(allItems, {
    threshold: fuzzyThreshold,
  });

  const categoriesInDb = await Category.find(
    restaurantId ? { restaurantId } : {}
  )
    .lean()
    .exec();

  const categoriesByNameLower = new Map(
    categoriesInDb.map((c) => [String(c.name).toLowerCase(), c])
  );

  const resultsMap = new Map<string, MappingResult>();

  function ensureCategory(name: string): MappingResult {
    const key = name.trim() || "Uncategorized";
    if (!resultsMap.has(key)) {
      const found = categoriesByNameLower.get(key.toLowerCase());
      resultsMap.set(key, {
        category: key,
        categoryId: found?._id?.toString(),
        items: [],
        evidence: [],
      });
    }
    return resultsMap.get(key)!;
  }

  for (const parsedCat of parsed.categories ?? []) {
    const categoryName = parsedCat.name?.trim() || "Uncategorized";
    const mappedCategory = ensureCategory(categoryName);

    const baseMap = new Map<
      string,
      {
        baseName: string;
        specs: Array<{ name: string; price: number }>;
        rawLines: string[];
        fallbackPrice?: number | null;
      }
    >();

    for (const pItem of parsedCat.items ?? []) {
      const rawName = pItem.name ?? "";
      const price = pItem.price ?? null;
      const { base, spec } = extractBaseAndSpec(rawName);

      const entry =
        baseMap.get(base) ?? {
          baseName: base,
          specs: [],
          rawLines: [],
          fallbackPrice: null,
        };

      if (spec) {
        entry.specs.push({ name: spec, price: price ?? 0 });
      } else if (price !== null) {
        entry.fallbackPrice = price;
      }

      if ((pItem as any).raw) entry.rawLines.push((pItem as any).raw);
      baseMap.set(base, entry);
    }

    for (const entry of baseMap.values()) {
      const mappedItem: MappingResult["items"][0] = {
        name: entry.baseName,
        specifications: entry.specs.length ? entry.specs : undefined,
        price: entry.specs.length
          ? undefined
          : entry.fallbackPrice ?? null,

        // STEP 4.3 default
        isAvailable: true,

        matchedItemId: null,
        matchedItemName: null,
        score: null,
        method: "none",
      };

      const exact = allItems.find(
        (it: IItem) =>
          String(it.name).toLowerCase() ===
          String(entry.baseName).toLowerCase()
      );

      if (exact) {
        mappedItem.matchedItemId = String((exact as any)._id);
        mappedItem.matchedItemName = exact.name;
        mappedItem.score = 0;
        mappedItem.method = "exact";
      } else {
        const res = fuse.search(entry.baseName, { limit: 1 });
        if (res.length && res[0].score !== undefined) {
          if (res[0].score <= fuzzyThreshold) {
            mappedItem.matchedItemId = String(
              (res[0].item as any)._id
            );
            mappedItem.matchedItemName = res[0].item.name;
            mappedItem.score = res[0].score;
            mappedItem.method = "fuzzy";
          }
        }
      }

      mappedCategory.items.push(mappedItem);
      mappedCategory.evidence?.push(...entry.rawLines);
    }
  }

  return Array.from(resultsMap.values()).filter(
    (c) => c.items.length > 0
  );
}

export default {
  mapParsedMenuToCategories,
};
