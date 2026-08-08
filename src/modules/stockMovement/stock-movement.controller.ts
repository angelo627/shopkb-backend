import { Request, Response } from "express";

import { asyncHandler } from "../../shared/utils/async-handler";
import { stockMovementService } from "./stock-movement.service";

import { getStockMovementsSchema } from "./stock-movement.validation";

import { AppError } from "../../shared/errors/app-error";

export const stockMovementController = {
  getStockMovements: asyncHandler(async (req: Request, res: Response) => {
    const query = getStockMovementsSchema.parse(req.query);

    const result = await stockMovementService.getStockMovements(query);

    res.status(200).json({
      success: true,
      message: "Stock movements retrieved successfully.",
      data: result,
    });
  }),

  getStockMovementById: asyncHandler(async (req: Request, res: Response) => {
    const movementId = req.params.id;

    if (!movementId || Array.isArray(movementId)) {
      throw new AppError(
        400,
        "Invalid or missing stock movement ID.",
        "INVALID_STOCK_MOVEMENT_ID",
      );
    }

    const result = await stockMovementService.getStockMovementById(movementId);

    res.status(200).json({
      success: true,
      message: "Stock movement retrieved successfully.",
      data: result,
    });
  }),
};
