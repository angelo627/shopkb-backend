import { Prisma, SaleStatus, UserRole } from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import {
  getCurrentBusinessDate,
  getDayRange,
} from "../../shared/utils/date.util";


export interface DailyReportResponse {
  date: string;
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
};
