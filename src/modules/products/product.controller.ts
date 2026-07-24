import { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/async-handler";
import { productService } from "./product.service";
import { getProductsSchema } from "./product.validation";
import { AppError } from "../../shared/errors/app-error";

export const productController = {
  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.createProduct({
      ...req.body,
      imageFile: req.file,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: result,
    });
  }),

  getProducts: asyncHandler(async (req, res) => {
    const query = getProductsSchema.parse(req.query);

    const result = await productService.getProducts(query);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      data: result,
    });
  }),

  getProductById: asyncHandler(async (req, res) => {
    const productId = req.params.id;

    if (!productId || Array.isArray(productId)) {
      throw new AppError(
        400,
        "Invalid or missing productId parameter.",
        "INVALID_PRODUCT_ID",
      );
    }
    const result = await productService.getProductById(productId);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully.",
      data: result,
    });
  }),
};