import { z } from "zod";

export const sampleOrderSchema = z.object({
  itemId: z.string(),
  quantity: z.number().min(1),
});
