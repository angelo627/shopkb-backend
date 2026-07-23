import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  description: z.string().trim().optional(),

  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  minimumStock: z.coerce.number().int().nonnegative().optional(),
});