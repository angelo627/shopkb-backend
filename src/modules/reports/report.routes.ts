import { Router } from "express";

import { reportController } from "./report.controller";

export const reportRouter = Router();
export const adminreportRouter = Router();

reportRouter.get(
    "/reports/daily",
    reportController.getDailyReport,
);


reportRouter.get(
    "/reports/weekly",
    reportController.getWeeklyReport,
);