import { Request, Response } from "express";

import { asyncHandler } from "../../shared/utils/async-handler";
import { businessDayService } from "./business-day.service";
import { AppError } from "../../shared/errors/app-error";

export const businessDayController = {
  openBusinessDay: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        401,
        "Authenticated user not found.",
        "UNAUTHENTICATED",
      );
    }

    const result = await businessDayService.openBusinessDay({
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Business day opened successfully.",
      data: result,
    });
  }),

  getCurrentBusinessDay: asyncHandler(async (_req: Request, res: Response) => {
    const result = await businessDayService.getCurrentBusinessDay();

    res.status(200).json({
      success: true,
      message: "Current business day retrieved successfully.",
      data: result,
    });
  }),

  closeBusinessDay: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        401,
        "Authenticated user not found.",
        "UNAUTHENTICATED",
      );
    }

    const result = await businessDayService.closeBusinessDay({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Business day closed successfully.",
      data: result,
    });
  }),

  getBusinessDayById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const result = await businessDayService.getBusinessDayById(id);

    res.status(200).json({
      success: true,
      message: "Business day retrieved successfully.",
      data: result,
    });
  }),

  getBusinessDays: asyncHandler(async (req, res) => {
    const result = await businessDayService.getBusinessDays(req.query);

    res.status(200).json({
      success: true,
      message: "Business days retrieved successfully.",
      data: result,
    });
  }),
};