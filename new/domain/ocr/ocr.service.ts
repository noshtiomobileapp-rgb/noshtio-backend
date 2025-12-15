/**
 * ocr.service.ts
 * High-level orchestration:
 *  1) use OCREngine to get plain text
 *  2) parse text to categories + items
 *  3) use CategoryService and MenuService to persist (idempotent handling recommended by caller)
 */

import { OCREngine } from "../../infrastructure/ocr/ocr.engine";
import { parseOCRTextToEntities } from "../../helpers/ocr-parser.helper";
import { CategoryService } from "../category/category.service";
import { MenuService } from "../menu/menu.service";
import {
  IOCRRaw,
  OCRCategoryCandidate,
  OCRMenuItemCandidate,
  OCRProcessResult,
} from "./ocr.types";

export class OCRService {
  private engine = new OCREngine();
  private categoryService = new CategoryService();
  private menuService = new MenuService();

  async processImage(filePath: string, meta?: { filename?: string; originalname?: string }) : Promise<OCRProcessResult> {
    // 1. recognize
    const rawText = await this.engine.recognize(filePath);

    // 2. parse
    const { categories, items } = parseOCRTextToEntities(rawText);

    // 3. persist categories (idempotency not handled here - simple insertMany)
    // Better approach: upsert by name. We'll attempt upsert-like behavior.
    const createdCategories: any[] = [];
    for (const c of categories) {
      // try find existing by name (case-insensitive)
      const exist = await this.categoryService.findByName?.(c.name);
      if (exist) {
        createdCategories.push(exist);
      } else {
        const created = await this.categoryService.create({ name: c.name, description: c.sourceText });
        createdCategories.push(created);
      }
    }

    // 4. map items to include categoryId if found
    const itemsToCreate: any[] = [];
    for (const it of items) {
      const category = createdCategories.find(
        (c) => c.name && c.name.toLowerCase() === (it.categoryName || "").toLowerCase()
      );
      const payload: any = {
        name: it.name,
        description: it.description,
        price: it.price,
      };
      if (category && category._id) payload.categoryId = category._id;
      itemsToCreate.push(payload);
    }

    // 5. persist menu items
    const createdItems = itemsToCreate.length > 0 ? await this.menuService.createFromOCR(itemsToCreate) : [];

    // Optionally cleanup file
    await this.engine.removeFile(filePath);

    return {
      rawText,
      categories,
      items,
      createdCategories,
      createdItems,
    };
  }
}
