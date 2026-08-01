import { z } from "zod";
import { BusinessDayStatus } from "@prisma/client";

export const openBusinessDaySchema = z.object({});

export const closeBusinessDaySchema = z.object({});

export const getCurrentBusinessDaySchema = z.object({});

export const getBusinessDayByIdSchema = z.object({
  id: z.uuid("Invalid business day ID."),
});

export const getBusinessDaysSchema = z.object({
  page: z.coerce.number().int().positive().optional(),

  limit: z.coerce.number().int().positive().max(100).optional(),

  status: z.nativeEnum(BusinessDayStatus).optional(),
});