/* --------------------------------------------------------------------------
 * src/modules/menu/menu.parser.ts
 * --------------------------------------------------------------------------
 * A robust menu parser with:
 *  - strict parse: only clear price+item lines
 *  - smart parse: heuristics for multi-line items, descriptions, category detection
 *  - OCR-friendly text normalization
 * Returns:
 *    { strict: MenuShape, smart: MenuShape }
 *    parseTextToMenu(rawText) → MenuShape (smart preferred)
 * -------------------------------------------------------------------------- */

type MenuItem = {
  name: string;
  price?: number | null;
  description?: string;
  raw?: string;
};

type Category = {
  name: string;
  items: MenuItem[];
};

type MenuShape = {
  categories: Category[];
};

/* ============================================================
   1. Normalization helpers
   ============================================================ */

const CATEGORY_KEYWORDS = [
  "starters", "snacks", "appetizers", "salads", "soups",
  "main", "main course", "mains",
  "pizza", "pizzas", "burgers", "sandwiches",
  "dessert", "desserts",
  "beverages", "drinks",
  "coffee", "tea",
  "rice", "biryani", "noodles", "pasta",
  "sides", "combos", "thali",
  "breakfast", "lunch", "dinner"
].map(s => s.toLowerCase());

const PRICE_RE =
  /(?:₹|rs\.?|rs|inr)?\s*([0-9]{1,5}(?:[.,][0-9]{1,2})?)\s*(?:₹|rs|rs\.?|inr|\/-|-)?$/i;

const JUNK_PATTERNS = [
  /thank you/i, /gst/i, /tax/i, /service charge/i,
  /net total/i, /subtotal/i, /page \d+/i,
  /www|http|order online/i
];

function cleanLine(s: string) {
  return s
    .replace(/\u00A0/g, " ")
    .replace(/[•·•]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, " ")
    .trim();
}

function isCategoryLine(line: string): boolean {
  const low = line.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  if (!low) return false;

  if (CATEGORY_KEYWORDS.some(k => low.includes(k))) return true;
  if (line === line.toUpperCase() && line.length <= 40) return true;
  if (/\b(menu|section|course|specials)\b/i.test(line)) return true;

  return false;
}

function extractPrice(line: string): number | null {
  const m = PRICE_RE.exec(line);
  if (!m) return null;

  const val = m[1].replace(/,/g, "");
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function removePricePart(line: string): string {
  return line.replace(PRICE_RE, "").trim();
}

function getLines(raw: string): string[] {
  return raw
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map(cleanLine)
    .filter(l => {
      if (!l) return false;
      if (l.length < 2) return false;
      if (JUNK_PATTERNS.some(j => j.test(l))) return false;
      return true;
    });
}

/* ============================================================
   2. STRICT PARSER
   ============================================================ */

function strictParse(rawText: string): MenuShape {
  const lines = getLines(rawText);
  const categories: Category[] = [];

  let current: Category = { name: "Uncategorized", items: [] };
  categories.push(current);

  for (const line of lines) {
    if (isCategoryLine(line)) {
      current = { name: line, items: [] };
      categories.push(current);
      continue;
    }

    const price = extractPrice(line);
    if (price !== null) {
      const name = removePricePart(line);
      current.items.push({ name, price, raw: line });
    }
  }

  return {
    categories: categories.filter(c => c.items.length > 0)
  };
}

/* ============================================================
   3. SMART PARSER
   ============================================================ */

function smartParse(rawText: string): MenuShape {
  const lines = getLines(rawText);
  const categories: Category[] = [];

  let current: Category = { name: "Uncategorized", items: [] };
  categories.push(current);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category
    if (isCategoryLine(line)) {
      current = { name: line, items: [] };
      categories.push(current);
      continue;
    }

    // Price on same line
    const price = extractPrice(line);
    if (price !== null) {
      const name = removePricePart(line);
      current.items.push({ name, price, raw: line });
      continue;
    }

    // Price on next line
    const next = lines[i + 1];
    if (next) {
      const nextPrice = extractPrice(next);
      if (nextPrice !== null) {
        const name = `${line} ${removePricePart(next)}`.trim();
        current.items.push({ name, price: nextPrice, raw: line + " " + next });
        i++;
        continue;
      }
    }

    // Multi-line description support
    const last = current.items[current.items.length - 1];
    if (last) {
      last.description = last.description
        ? `${last.description} ${line}`
        : line;
      continue;
    }

    // Item with no price
    current.items.push({ name: line, price: null, raw: line });
  }

  // Cleanup categories
  const cleaned = categories
    .map(cat => ({
      name: cat.name,
      items: cat.items
        .map(it => ({
          ...it,
          name: it.name.trim(),
          description: it.description?.trim(),
        }))
        .filter(it => it.name.length > 0),
    }))
    .filter(cat => cat.items.length > 0);

  return { categories: cleaned.length ? cleaned : [{ name: "Menu", items: [] }] };
}

/* ============================================================
   4. PUBLIC EXPORT
   ============================================================ */

export default {
  parseTextToMenuVariants(rawText: string): {
    strict: MenuShape;
    smart: MenuShape;
  } {
    return {
      strict: strictParse(rawText),
      smart: smartParse(rawText),
    };
  },

  parseTextToMenu(rawText: string): MenuShape {
    const { strict, smart } = this.parseTextToMenuVariants(rawText);
    return smart.categories.length > 0 ? smart : strict;
  },
};
