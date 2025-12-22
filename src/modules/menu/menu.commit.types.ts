export interface ApprovedItemInput {
  name: string;
  price?: number | null;
  matchedItemId?: string | null;
}

export interface ApprovedCategoryInput {
  category: string;
  items: ApprovedItemInput[];
}

export interface CommitPayload {
  restaurantId: string;
  mapping: ApprovedCategoryInput[];
}
