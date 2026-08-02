import {
  BusinessDayStatus,
} from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";

import {
  BusinessDayResponse,
  toBusinessDayResponse,
} from "./business-day.mapper";

import {
  activityLogService,
} from "../activity-logs/activity-log.service";

import {
  activityDescription,
} from "../activity-logs/activity-log.mapper";

import {
  ActivityAction,
  ActivityEntity,
} from "@prisma/client";

import { businessDayInclude } from "./business-day.mapper";
import { BusinessDayListResponse } from "./business-day.mapper";

export interface BusinessDayContext {
  userId: string;
}

function getBusinessDate(): Date {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
}

//helper func
async function getOpenBusinessDay() {
  const businessDay = await prisma.businessDay.findFirst({
    where: {
      status: BusinessDayStatus.OPEN,
    },
    include: businessDayInclude,
  });

  if (!businessDay) {
    throw new AppError(
      404,
      "No business day is currently open.",
      "BUSINESS_DAY_NOT_FOUND",
    );
  }

  return businessDay;
}

export interface GetBusinessDaysQuery {
  page?: number;
  limit?: number;
  status?: BusinessDayStatus;
}

export const businessDayService = {
  async requireOpenBusinessDay() {
    return await getOpenBusinessDay();
  },

  async getCurrentBusinessDayOrNull() {
    return await prisma.businessDay.findFirst({
      where: {
        status: BusinessDayStatus.OPEN,
      },
    });
  },

  async openBusinessDay(
    context: BusinessDayContext,
  ): Promise<BusinessDayResponse> {
    const existingBusinessDay = await prisma.businessDay.findFirst({
      where: {
        status: BusinessDayStatus.OPEN,
      },
    });

    if (existingBusinessDay) {
      throw new AppError(
        409,
        "A business day is already open.",
        "BUSINESS_DAY_ALREADY_OPEN",
      );
    }

    const businessDate = getBusinessDate();

    const businessDay = await prisma.$transaction(async (tx) => {
      const businessDay = await tx.businessDay.create({
        data: {
          businessDate,
          status: BusinessDayStatus.OPEN,
          openedById: context.userId,
        },
        include: businessDayInclude,
      });

      await activityLogService.createActivity(
        {
          userId: context.userId,

          businessDayId: businessDay.id,

          action: ActivityAction.BUSINESS_DAY_OPENED,

          entityType: ActivityEntity.BUSINESS_DAY,

          entityId: businessDay.id,

          description: activityDescription.businessDayOpened(),
        },
        tx,
      );

      return businessDay;
    });

    return toBusinessDayResponse(businessDay);
  },

  async getCurrentBusinessDay(): Promise<BusinessDayResponse> {
    const businessDay = await getOpenBusinessDay();

    return toBusinessDayResponse(businessDay);
  },

  async closeBusinessDay(
    context: BusinessDayContext,
  ): Promise<BusinessDayResponse> {
    const businessDay = await getOpenBusinessDay();

    const closedBusinessDay = await prisma.$transaction(async (tx) => {
      const updatedBusinessDay = await tx.businessDay.update({
        where: {
          id: businessDay.id,
        },
        data: {
          status: BusinessDayStatus.CLOSED,

          closedById: context.userId,

          closedAt: new Date(),
        },
        include: businessDayInclude,
      });

      await activityLogService.createActivity(
        {
          userId: context.userId,

          businessDayId: updatedBusinessDay.id,

          action: ActivityAction.BUSINESS_DAY_CLOSED,

          entityType: ActivityEntity.BUSINESS_DAY,

          entityId: updatedBusinessDay.id,

          description: activityDescription.businessDayClosed(),
        },
        tx,
      );

      return updatedBusinessDay;
    });

    return toBusinessDayResponse(closedBusinessDay);
  },

  async getBusinessDayById(id: string): Promise<BusinessDayResponse> {
    const businessDay = await prisma.businessDay.findUnique({
      where: {
        id,
      },
      include: businessDayInclude,
    });

    if (!businessDay) {
      throw new AppError(
        404,
        "Business day not found.",
        "BUSINESS_DAY_NOT_FOUND",
      );
    }

    return toBusinessDayResponse(businessDay);
  },

  async getBusinessDays(
    query: GetBusinessDaysQuery,
  ): Promise<BusinessDayListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    const where = {
      ...(query.status && {
        status: query.status,
      }),
    };

    const total = await prisma.businessDay.count({
      where,
    });

    const businessDays = await prisma.businessDay.findMany({
      where,

      include: businessDayInclude,

      skip,
      take: limit,

      orderBy: {
        businessDate: "desc",
      },
    });

    const data = businessDays.map(toBusinessDayResponse);

    return {
      data,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};