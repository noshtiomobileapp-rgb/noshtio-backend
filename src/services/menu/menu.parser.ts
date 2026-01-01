/**
 * Parsed menu item extracted from OCR text
 */
export type ParsedMenuItem = {
  name: string;
  price: number;
};

/**
 * Convert raw OCR text into menu items.
 * Rules:
 * - One item per line
 * - Price must be present (2–4 digits)
 * - Noise lines are ignored
 */
export function parseMenuText(
  text: string
): ParsedMenuItem[] {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const items: ParsedMenuItem[] = [];

  // Example: "Chicken Biryani 180"
  const priceRegex = /(.+?)\s+(\d{2,4})$/;

  for (const line of lines) {
    const match = line.match(priceRegex);
    if (!match) continue;

    items.push({
      name: match[1].trim(),
      price: Number(match[2]),
    });
  }

  return items;
}
