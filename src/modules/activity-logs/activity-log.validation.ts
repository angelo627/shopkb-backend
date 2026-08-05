import { z } from "zod";

export const getActivityLogsSchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  userId: z.string().uuid().optional(),

  businessDayId: z.string().uuid().optional(),

  action: z.string().optional(), //z.nativeEnum(ActivityAction),

  entityType: z.string().optional(), //z.nativeEnum(ActivityEntity).optional()

  entityId: z.string().optional(),

  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),

  search: z.string().trim().optional(),

  order: z.enum(["asc", "desc"]).optional(),
});
