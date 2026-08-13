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
};
