import { Router } from "express";

import { saleController } from "./sale.controller";
import { createSaleSchema, getSalesSchema } from "./sale.validation";
import { validateRequest } from "../../shared/validation/validate-request";


export const saleRouter = Router();
export const adminsaleRouter = Router();


saleRouter.post(
  "/make-sales",
  validateRequest(createSaleSchema),
  saleController.createSale,
);


adminsaleRouter.get(
  "/get-sales",
  validateRequest(getSalesSchema, "query"),
  saleController.getSales,
);