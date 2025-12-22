import { z } from "zod";

export const ApprovedItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nullable().optional(),
  matchedItemId: z.string().nullable().optional(),
});

export const ApprovedCategorySchema = z.object({
  category: z.string().min(1),
  items: z.array(ApprovedItemSchema).min(1),
});

export const CommitPayloadSchema = z.object({
  restaurantId: z.string(),
  mapping: z.array(ApprovedCategorySchema).min(1),
});

export type CommitPayloadDTO = z.infer<typeof CommitPayloadSchema>;
