import {
  ActivityAction,
  ActivityEntity,
} from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { Prisma } from "@prisma/client";
import {
  ActivityLogResponse,
  toActivityLogResponse,
  ActivityLogsResponse,
  GetActivityLogsInput,
} from "./activity-log.mapper";
import { AppError } from "../../shared/errors/app-error";
import { DbClient } from "../../types/db-client";



export interface CreateActivityLogInput {
  userId: string;

  action: ActivityAction;

  entityType?: ActivityEntity | null;
  entityId?: string | null;

  businessDayId?: string | null;

  description?: string | null;
}



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

    const activity = await db.activityLog.create({
      data: {
        userId: userId,

        businessDayId: input.businessDayId ?? null,

        action: input.action,

        entityType: input.entityType ?? null,

        entityId: input.entityId ?? null,

        description,
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return toActivityLogResponse(activity);
  },

  async getActivityLogs(
    input: GetActivityLogsInput,
  ): Promise<ActivityLogsResponse> {
    const page = input.page ?? 1;

    const limit = input.limit ?? 20;

    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};

    if (input.userId) {
      where.userId = input.userId;
    }

    if (input.businessDayId) {
      where.businessDayId = input.businessDayId;
    }

    if (input.action) {
      where.action = input.action;
    }

    if (input.entityType) {
      where.entityType = input.entityType;
    }

    if (input.entityId) {
      where.entityId = input.entityId;
    }

    if (input.from || input.to) {
      where.createdAt = {};

      if (input.from) {
        where.createdAt.gte = input.from;
      }

      if (input.to) {
        where.createdAt.lte = input.to;
      }
    }

    if (input.search) {
      where.OR = [
        {
          description: {
            contains: input.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const total = await prisma.activityLog.count({
      where,
    });

    const activities = await prisma.activityLog.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },

      orderBy: {
        createdAt: input.order ?? "desc",
      },

      skip,

      take: limit,
    });

    return {
      activities: activities.map(toActivityLogResponse),

      pagination: {
        page,

        limit,

        total,

        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
