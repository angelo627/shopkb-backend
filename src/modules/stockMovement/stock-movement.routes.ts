import { Router } from "express";

import { stockMovementController } from "./stock-movement.controller";

import { validateRequest } from "../../shared/validation/validate-request";

import {
  getStockMovementsSchema,
  getStockMovementByIdSchema,
} from "./stock-movement.validation";

export const stockMovementRouter = Router();
export const adminStockMovementRouter = Router();

stockMovementRouter.get(
  "/get/stock-movements",
  validateRequest(getStockMovementsSchema, "query"),
  stockMovementController.getStockMovements,
);

stockMovementRouter.get(
  "/stock-movements/:id",
  validateRequest(getStockMovementByIdSchema, "params"),
  stockMovementController.getStockMovementById,
);
