import { Router } from "express";

import { saleController } from "./sale.controller";
import { createSaleSchema, getSalesSchema, saleIdSchema } from "./sale.validation";
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

adminsaleRouter.get(
  "/sales/:id",
  validateRequest(saleIdSchema, "params"),
  saleController.getSaleById,
);

adminsaleRouter.post(
  "/sales/:id/cancel",
  validateRequest(saleIdSchema, "params"),
  saleController.cancelSale,
);