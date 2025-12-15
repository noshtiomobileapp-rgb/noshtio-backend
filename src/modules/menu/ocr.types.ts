/**
 * These types are LOCAL ADAPTER types for menu mapping.
 * They DO NOT replace or modify the OCR module contracts.
 * They exist only to normalize OCR output for menu.mapper.ts
 */

/**
 * A single parsed menu item line from OCR
 */
export interface ParsedMenuItem {
  /** Cleaned item name extracted from OCR */
  name: string;

  /** Parsed numeric price if detected */
  price?: number | null;

  /** Original raw OCR line (for evidence/debug) */
  raw?: string;
}

/**
 * A logical category detected by OCR
 */
export interface ParsedMenuCategory {
  /** Category heading (e.g., "Starters", "Beverages") */
  name: string;

  /** Items under this category */
  items: ParsedMenuItem[];
}

/**
 * Canonical shape consumed by menu.mapper.ts
 * This is what OCR → Menu Mapping depends on.
 */
export interface ParsedMenuShape {
  /** Ordered list of categories as detected in OCR */
  categories: ParsedMenuCategory[];
}
