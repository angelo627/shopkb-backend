import { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler";
import { productService } from "./product.service";

export const productController = {
  createProduct: asyncHandler(
    async (req: Request, res: Response) => {
      const result = await productService.createProduct({
          ...req.body,
          imageFile: req.file,
        });
        
      res.status(201).json({
        success: true,
        message: "Product created successfully.",
        data: result,
      });
    }
  ),
};