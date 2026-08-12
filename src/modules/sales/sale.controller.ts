import { Request, Response, NextFunction } from "express";
import { saleService } from "./sale.service";
import { AppError } from "../../shared/errors/app-error";

export const saleController = {
  async createSale(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await saleService.createSale(
        {
          userId: req.user!.id,
        },
        req.body,
      );

      return res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Sale created successfully.",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSales(req: Request, res: Response) {
    const result = await saleService.getSales(req.query);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Sales retrieved successfully.",
      data: result,
    });
  },

  async getSaleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        throw new AppError(400, "Invalid sale ID.", "INVALID_SALE_ID");
      }

      const sale = await saleService.getSaleById(id);

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Sale retrieved successfully.",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (typeof id !== "string") {
        throw new AppError(400, "Invalid sale ID.", "INVALID_SALE_ID");
      }

      const sale = await saleService.cancelSale(id, {
        userId: req.user!.id,
      });

      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Sale cancelled successfully.",
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  },
};
