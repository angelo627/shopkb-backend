import { z } from "zod";

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
