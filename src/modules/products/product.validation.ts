import { z } from "zod";

import { ProductStatus } from "@prisma/client";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  description: z.string().trim().optional(),

  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stockQuantity: z.coerce.number().int().nonnegative().optional(),
  minimumStock: z.coerce.number().int().nonnegative().optional(),
});

export const getProductsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1.")
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit cannot exceed 100.")
    .optional(),

  search: z
    .string()
    .trim()
    .min(1)
    .optional(),

  status: z
    .nativeEnum(ProductStatus)
    .optional(),
});

export const getProductByIdSchema = z.object({
  id: z.uuid("Invalid product ID."),
});

export type GetProductsQuery = z.infer<typeof getProductsSchema>;