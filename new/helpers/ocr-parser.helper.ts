/**
 * ocr-parser.helper.ts
 * Basic rule-based parser to convert raw OCR text into category candidates and menu item candidates.
 *
 * This is intentionally simple — tune using real OCR samples.
 */

import {
  OCRCategoryCandidate,
  OCRMenuItemCandidate,
} from "../domain/ocr/ocr.types";

/**
 * Heuristics used:
 * - Lines with all-caps or ending with ':' are treated as category headers.
 * - Lines that contain a price (numbers with ₹, Rs, or decimal) are treated as menu items.
 * - A menu item line may be "Name ...... 199" or "Name - description - 199".
 */

const PRICE_REGEX = /(?:₹|Rs\.?|INR)?\s*([0-9]{1,5}(?:[.,][0-9]{1,2})?)/;

export function parseOCRTextToEntities(rawText: string) {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const categories: OCRCategoryCandidate[] = [];
  const items: OCRMenuItemCandidate[] = [];

  let currentCategory = "Uncategorized";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // detect category heuristics: short lines in ALL CAPS or ending with ':' or section words
    const isAllCaps = line === line.toUpperCase() && line.length <= 40;
    const endsWithColon = line.endsWith(":");
    const isSectionWord = /^(starters|main|dessert|beverages|drinks|sides|veg|non-veg)$/i.test(
      line.toLowerCase()
    );

    if (isAllCaps || endsWithColon || isSectionWord) {
      const name = line.replace(/:$/, "").trim();
      categories.push({ name, sourceText: line });
      currentCategory = name;
      continue;
    }

    // detect price in line -> candidate menu item
    const priceMatch = line.match(PRICE_REGEX);
    if (priceMatch) {
      const priceRaw = priceMatch[1].replace(",", "");
      const price = parseFloat(priceRaw);
      // split name and description heuristics: before price
      const beforePrice = line.slice(0, priceMatch.index).trim();
      let name = beforePrice;
      let description = "";

      // attempt to split name - description using dash or comma
      if (beforePrice.includes(" - ")) {
        const [n, ...rest] = beforePrice.split(" - ");
        name = n.trim();
        description = rest.join(" - ").trim();
      } else if (beforePrice.includes(",")) {
        const [n, ...rest] = beforePrice.split(",");
        name = n.trim();
        description = rest.join(",").trim();
      } else {
        // try next line as description if next line is short
        if (i + 1 < lines.length && lines[i + 1].length < 80 && !lines[i + 1].match(PRICE_REGEX)) {
          description = lines[i + 1];
          i++; // consume next line
        }
      }

      items.push({
        name,
        description: description || undefined,
        price: isNaN(price) ? undefined : price,
        categoryName: currentCategory,
        raw: line,
      });

      continue;
    }

    // fallback: small lines that look like item name (no price) — optionally pair with next line price
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextPrice = nextLine.match(PRICE_REGEX);
      if (nextPrice) {
        // combine
        const priceRaw = nextPrice[1].replace(",", "");
        const price = parseFloat(priceRaw);
        items.push({
          name: line,
          description: undefined,
          price: isNaN(price) ? undefined : price,
          categoryName: currentCategory,
          raw: `${line} ${nextLine}`,
        });
        i++; // consumed next line
      }
    }
  }

  // if no categories were found, add 'Uncategorized' if items exist
  if (categories.length === 0 && items.length > 0) {
    categories.push({ name: "Uncategorized" });
    items.forEach((it) => {
      if (!it.categoryName) it.categoryName = "Uncategorized";
    });
  }

  return { categories, items };
}
