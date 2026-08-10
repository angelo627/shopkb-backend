import { Router } from "express";

import { saleController } from "./sale.controller";
import { createSaleSchema } from "./sale.validation";
import { validateRequest } from "../../shared/validation/validate-request";

export const saleRouter = Router();
export const adminsaleRouter = Router();


saleRouter.post(
  "/make-sales",
  validateRequest(createSaleSchema),
  saleController.createSale,
);
