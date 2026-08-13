import {
  MovementReason,
  MovementType,
  SaleStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import {
  getCurrentBusinessDate,
  getDayRange,
  getMonthRange,
  getWeekRange,
} from "../../shared/utils/date.util";


export interface DailyReportResponse {
  date: string;
  revenue?: number;
  itemsSold: number;
  stockReceived: number;
  activities: number;
}

export interface WeeklyReportResponse {
  startDate: Date;
  endDate: Date;
  revenue?: number;
  itemsSold: number;
  stockReceived: number;
  activities: number;
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  revenue?: number;
  itemsSold: number;
  stockReceived: number;
  activities: number;
}

export const reportService = {
  async getDailyReport(role: UserRole): Promise<DailyReportResponse> {
    const date = getCurrentBusinessDate();
    const { start, end } = getDayRange(date);

    const canViewRevenue =
      role === UserRole.ADMIN || role === UserRole.SUPERADMIN;

    const [itemsSoldResult, stockReceivedResult, activities, revenueResult] =
      await Promise.all([
        // 1. Items sold
        prisma.saleItem.aggregate({
          where: {
            sale: {
              status: SaleStatus.COMPLETED,
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 2. Stock received
        prisma.stockMovement.aggregate({
          where: {
            movementType: "IN",
            reason: "STOCK_RECEIVED",
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 3. Activities
        prisma.activityLog.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),

        // 4. Revenue — only query it when the user is allowed to see it
        canViewRevenue
          ? prisma.sale.aggregate({
              where: {
                status: SaleStatus.COMPLETED,
                createdAt: {
                  gte: start,
                  lt: end,
                },
              },
              _sum: {
                totalAmount: true,
              },
            })
          : Promise.resolve(null),
      ]);

    const report: DailyReportResponse = {
      date,

      itemsSold: itemsSoldResult._sum.quantity ?? 0,

      stockReceived: stockReceivedResult._sum.quantity ?? 0,

      activities,
    };

    if (canViewRevenue && revenueResult) {
      report.revenue = Number(revenueResult._sum.totalAmount ?? 0);
    }

    return report;
  },

  async getWeeklyReport(role: UserRole): Promise<WeeklyReportResponse> {
    const date = getCurrentBusinessDate();
    const { start, end } = getWeekRange(date);

    const canViewRevenue =
      role === UserRole.ADMIN || role === UserRole.SUPERADMIN;

    const [itemsSoldResult, stockReceivedResult, activities, revenueResult] =
      await Promise.all([
        // 1. Items sold
        prisma.saleItem.aggregate({
          where: {
            sale: {
              status: SaleStatus.COMPLETED,
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 2. Stock received
        prisma.stockMovement.aggregate({
          where: {
            movementType: MovementType.IN,
            reason: MovementReason.STOCK_RECEIVED,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 3. Activities
        prisma.activityLog.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),

        // 4. Revenue — only for ADMIN/SUPERADMIN
        canViewRevenue
          ? prisma.sale.aggregate({
              where: {
                status: SaleStatus.COMPLETED,
                createdAt: {
                  gte: start,
                  lt: end,
                },
              },
              _sum: {
                totalAmount: true,
              },
            })
          : Promise.resolve(null),
      ]);

    const report: WeeklyReportResponse = {
      startDate: start,
      endDate: end,

      itemsSold: itemsSoldResult._sum.quantity ?? 0,

      stockReceived: stockReceivedResult._sum.quantity ?? 0,

      activities,
    };

    if (canViewRevenue && revenueResult) {
      report.revenue = Number(revenueResult._sum.totalAmount ?? 0);
    }

    return report;
  },

  async getMonthlyReport(
    role: UserRole,
    year: number,
    month: number,
  ): Promise<MonthlyReportResponse> {
    const { start, end } = getMonthRange(year, month);

    const canViewRevenue =
      role === UserRole.ADMIN || role === UserRole.SUPERADMIN;

    const [itemsSoldResult, stockReceivedResult, activities, revenueResult] =
      await Promise.all([
        // 1. Items sold
        prisma.saleItem.aggregate({
          where: {
            sale: {
              status: SaleStatus.COMPLETED,
              createdAt: {
                gte: start,
                lt: end,
              },
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 2. Stock received
        prisma.stockMovement.aggregate({
          where: {
            movementType: MovementType.IN,
            reason: MovementReason.STOCK_RECEIVED,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            quantity: true,
          },
        }),

        // 3. Activities
        prisma.activityLog.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),

        // 4. Revenue — ADMIN/SUPERADMIN only
        canViewRevenue
          ? prisma.sale.aggregate({
              where: {
                status: SaleStatus.COMPLETED,
                createdAt: {
                  gte: start,
                  lt: end,
                },
              },
              _sum: {
                totalAmount: true,
              },
            })
          : Promise.resolve(null),
      ]);

    const report: MonthlyReportResponse = {
      year,
      month,

      itemsSold: itemsSoldResult._sum.quantity ?? 0,

      stockReceived: stockReceivedResult._sum.quantity ?? 0,

      activities,
    };

    if (canViewRevenue && revenueResult) {
      report.revenue = Number(revenueResult._sum.totalAmount ?? 0);
    }

    return report;
  },
};
