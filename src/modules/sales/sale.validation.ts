import { z } from "zod";
import { SaleStatus } from "@prisma/client";


export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required."),
        quantity: z
          .number()
          .int("Quantity must be a whole number.")
          .positive("Quantity must be greater than zero."),
      }),
    )
    .min(1, "At least one product is required."),
});


export const getSalesSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),

  search: z.string().trim().min(1).optional(),

  productId: z.string().uuid().optional(),

  soldById: z.string().uuid().optional(),

  businessDayId: z.string().uuid().optional(),

  status: z.nativeEnum(SaleStatus).optional(),

  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid from date. Use YYYY-MM-DD.")
    .optional(),

  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid to date. Use YYYY-MM-DD.")
    .optional(),
});
