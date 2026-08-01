import { Router } from "express";

import { businessDayController } from "./business-day.controller";
import { validateRequest } from "../../shared/validation/validate-request";

import {
  openBusinessDaySchema,
  closeBusinessDaySchema,
  getCurrentBusinessDaySchema,
  getBusinessDayByIdSchema,
  getBusinessDaysSchema,
} from "./business-day.validation";

export const businessDayRouter = Router();
export const adminBusinessDayRouter = Router();

adminBusinessDayRouter.post(
  "/open-business-days",
 //   validateRequest(openBusinessDaySchema),
  businessDayController.openBusinessDay,
);

adminBusinessDayRouter.post(
  "/close-business-days",
 //   validateRequest(closeBusinessDaySchema),
  businessDayController.closeBusinessDay,
);

adminBusinessDayRouter.get(
  "/current-business-days",
  //   validateRequest(getCurrentBusinessDaySchema),
  businessDayController.getCurrentBusinessDay,
);

adminBusinessDayRouter.get(
  "/getday/:id",
  validateRequest(getBusinessDayByIdSchema, "params"),
  businessDayController.getBusinessDayById,
);

adminBusinessDayRouter.get(
  "/business-days",
  validateRequest(getBusinessDaysSchema, "query"),
  businessDayController.getBusinessDays,
);




businessDayRouter.get(
  "/current-business-days",
 //   validateRequest(getCurrentBusinessDaySchema),
  businessDayController.getCurrentBusinessDay,
);