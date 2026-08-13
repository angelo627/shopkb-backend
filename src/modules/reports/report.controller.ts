import { Request, Response, NextFunction } from "express";

import { reportService } from "./report.service";

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
      const year = Number(req.query.year);
      const month = Number(req.query.month);

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
