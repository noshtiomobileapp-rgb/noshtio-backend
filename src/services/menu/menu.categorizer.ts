import { ParsedMenuItem } from "./menu.parser";

/**
 * Category → keyword mapping (MVP rules)
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Starters: ["starter", "tikka", "pakora", "fry"],
  "Main Course": ["biryani", "masala", "curry", "rice"],
  Beverages: ["tea", "coffee", "juice", "shake"],
};

/**
 * Group parsed menu items into categories.
 * Unmatched items go into "Others".
 */
export function groupItemsIntoCategories(
  items: ParsedMenuItem[]
): {
  name: string;
  items: ParsedMenuItem[];
}[] {
  const grouped: Record<string, ParsedMenuItem[]> = {};

  for (const item of items) {
    const itemName = item.name.toLowerCase();
    let matched = false;

    for (const [category, keywords] of Object.entries(
      CATEGORY_KEYWORDS
    )) {
      if (keywords.some(k => itemName.includes(k))) {
        grouped[category] ||= [];
        grouped[category].push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      grouped["Others"] ||= [];
      grouped["Others"].push(item);
    }
  }

  return Object.entries(grouped).map(
    ([name, items]) => ({
      name,
      items,
    })
  );
}
