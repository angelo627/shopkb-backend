import { Request, Response, NextFunction } from "express";

import { reportService } from "./report.service";
import { getCurrentBusinessDate } from "../../shared/utils/date.util";

export const reportController = {
  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getDailyReport(req.user!.role);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Daily report retrieved successfully.",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeeklyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getWeeklyReport(req.user!.role);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Weekly report retrieved successfully.",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const currentBusinessDate = getCurrentBusinessDate();

      const dateParts = currentBusinessDate.split("-");

      const currentYear = Number(dateParts[0]);
      const currentMonth = Number(dateParts[1]);

      const yearValue = req.query.year;
      const monthValue = req.query.month;

      const year =
        typeof yearValue === "string" ? Number(yearValue) : currentYear;

      const month =
        typeof monthValue === "string" ? Number(monthValue) : currentMonth;

      const report = await reportService.getMonthlyReport(
        req.user!.role,
        year,
        month,
      );

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Monthly report retrieved successfully.",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};
