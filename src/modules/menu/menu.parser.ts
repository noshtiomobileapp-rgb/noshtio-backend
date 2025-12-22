/* --------------------------------------------------------------------------
 * src/modules/menu/menu.parser.ts
 * --------------------------------------------------------------------------
 * Robust OCR menu parser with:
 *  - strict parse
 *  - smart parse
 *  - heuristics
 *  - junk filtering
 *
 * PLUS (STEP 3):
 *  - hardening layer
 *  - category deduplication
 *  - garbage removal
 *  - frontend-safe output
 * -------------------------------------------------------------------------- */

/* ============================================================
   Internal Types (UNCHANGED)
   ============================================================ */

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
   STEP-3 OUTPUT TYPE (FRONTEND SAFE)
   ============================================================ */

export type ParsedMenuCategory = {
  category: string;
  items: {
    name: string;
    price: number | null;
  }[];
};

/* ============================================================
   Normalization helpers (existing)
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
   STRICT PARSER (UNCHANGED)
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
    categories: categories.filter(c => c.items.length > 0),
  };
}

/* ============================================================
   SMART PARSER (UNCHANGED)
   ============================================================ */

function smartParse(rawText: string): MenuShape {
  const lines = getLines(rawText);
  const categories: Category[] = [];

  let current: Category = { name: "Uncategorized", items: [] };
  categories.push(current);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isCategoryLine(line)) {
      current = { name: line, items: [] };
      categories.push(current);
      continue;
    }

    const price = extractPrice(line);
    if (price !== null) {
      const name = removePricePart(line);
      current.items.push({ name, price, raw: line });
      continue;
    }

    const next = lines[i + 1];
    if (next) {
      const nextPrice = extractPrice(next);
      if (nextPrice !== null) {
        const name = `${line} ${removePricePart(next)}`.trim();
        current.items.push({
          name,
          price: nextPrice,
          raw: line + " " + next,
        });
        i++;
        continue;
      }
    }

    const last = current.items[current.items.length - 1];
    if (last) {
      last.description = last.description
        ? `${last.description} ${line}`
        : line;
      continue;
    }

    current.items.push({ name: line, price: null, raw: line });
  }

  return {
    categories: categories.filter(c => c.items.length > 0),
  };
}

/* ============================================================
   STEP-3 HARDENING LAYER (NEW)
   ============================================================ */

function isValidItemName(name: string): boolean {
  const cleaned = name.trim();
  return cleaned.length >= 2 && /[a-zA-Z]/.test(cleaned);
}

function hardenMenu(menu: MenuShape): ParsedMenuCategory[] {
  const map = new Map<string, ParsedMenuCategory>();

  for (const category of menu.categories) {
    const key = category.name.trim().toLowerCase();

    for (const item of category.items) {
      if (!isValidItemName(item.name)) continue;

      if (!map.has(key)) {
        map.set(key, {
          category: category.name.trim(),
          items: [],
        });
      }

      map.get(key)!.items.push({
        name: item.name.trim(),
        price: item.price ?? null,
      });
    }
  }

  return [...map.values()].filter(c => c.items.length > 0);
}

/* ============================================================
   PUBLIC EXPORT (HARDENED)
   ============================================================ */

export default {
  parseTextToMenu(rawText: string): ParsedMenuCategory[] {
    const smart = smartParse(rawText);
    const strict = strictParse(rawText);

    const base =
      smart.categories.length > 0 ? smart : strict;

    return hardenMenu(base);
  },
};
