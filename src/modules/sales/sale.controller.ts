import { Request, Response, NextFunction } from "express";
import { saleService } from "./sale.service";

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
};
