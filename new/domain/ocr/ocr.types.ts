import { ObjectId } from "mongoose";

export interface IOCRRaw {
  text: string;
  engine?: string;
}

export interface OCRCategoryCandidate {
  name: string;
  confidence?: number;
  sourceText?: string;
}

export interface OCRMenuItemCandidate {
  name: string;
  description?: string;
  price?: number;
  categoryName?: string;
  raw?: string;
  confidence?: number;
}

export interface OCRProcessResult {
  rawText: string;
  categories: OCRCategoryCandidate[];
  items: OCRMenuItemCandidate[];
  createdCategories?: any;
  createdItems?: any;
}
