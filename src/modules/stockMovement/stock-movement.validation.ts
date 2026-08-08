import { z } from "zod";
import { MovementReason, MovementType } from "@prisma/client";

export const getStockMovementsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  search: z.string().trim().optional(),

  productId: z.uuid().optional(),

  userId: z.uuid().optional(),

  businessDayId: z.uuid().optional(),

  movementType: z.nativeEnum(MovementType).optional(),

  reason: z.nativeEnum(MovementReason).optional(),

  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),
});

export const getStockMovementByIdSchema = z.object({
  id: z.uuid("Invalid stock movement ID."),
});

export type GetStockMovementsQuery = z.infer<typeof getStockMovementsSchema>;
