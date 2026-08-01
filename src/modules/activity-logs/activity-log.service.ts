import {
  ActivityAction,
  ActivityEntity,
} from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { Prisma } from "@prisma/client";
import {
  ActivityLogResponse,
  toActivityLogResponse,
} from "./activity-log.mapper";
import { AppError } from "../../shared/errors/app-error";


export interface CreateActivityLogInput {
  userId: string;

  action: ActivityAction;

  entityType?: ActivityEntity | null;
  entityId?: string | null;

  businessDayId?: string | null;

  description?: string | null;
}


type DbClient = Prisma.TransactionClient | typeof prisma;

export const activityLogService = {
  async createActivity(
    input: CreateActivityLogInput,
    db: DbClient = prisma,
  ): Promise<ActivityLogResponse> {

    const userId = input.userId.trim();

    if (!userId) {
      throw new AppError(400, "User ID is required.", "INVALID_USER_ID");
    }

    const description = input.description?.trim() || null;

    const activity =
      await db.activityLog.create({
        data: {
          userId: userId,

          businessDayId:
            input.businessDayId ?? null,

          action: input.action,

          entityType:
            input.entityType ?? null,

          entityId:
            input.entityId ?? null,

          description,
        },
      });

    return toActivityLogResponse(activity);
  },
};
