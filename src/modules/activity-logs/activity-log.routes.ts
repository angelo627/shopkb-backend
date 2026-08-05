import { Router } from "express";

import { activityLogController } from "./activity-log.controller";
import { validateRequest } from "../../shared/validation/validate-request";

import { getActivityLogsSchema } from "./activity-log.validation";

export const activityLogRouter = Router();
export const adminActivityLogRouter = Router();

adminActivityLogRouter.get(
  "/anyActivity-logs",
  validateRequest(getActivityLogsSchema, "query"),
  activityLogController.getActivityLogs,
);
