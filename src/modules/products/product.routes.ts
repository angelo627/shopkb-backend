import { Router } from "express";
import { productController } from "./product.controller";
import { uploadProductImage } from "../../middlewares/upload.middleware";
import { validateRequest } from "../../shared/validation/validate-request";
import {
  getProductsSchema,
  getProductByIdSchema,
  updateProductSchema,
  receiveStockSchema,
  createProductSchema,
  removeStockSchema,
  adjustStockSchema,
} from "../products/product.validation";

export const productRouter = Router();
export const adminProductRouter = Router();
// export const superAdminProductRouter = Router();  , eventually i will use this 

// ADMIN & SUPERADMIN
adminProductRouter.post("/createproducts",
  uploadProductImage.single("image"),
  validateRequest(createProductSchema),
  productController.createProduct
);

adminProductRouter.patch(
  "/updateproduct/:id",
  uploadProductImage.single("image"),
  validateRequest(updateProductSchema),
  validateRequest(getProductByIdSchema, "params"),
  productController.updateProduct,
);

adminProductRouter.delete(
  "/deleteproduct/:id",
  validateRequest(getProductByIdSchema, "params"),
  productController.deleteProduct,
);

adminProductRouter.patch(
  "/:id/deactivate",
  validateRequest(getProductByIdSchema, "params"),
  productController.deactivateProduct,
);

adminProductRouter.patch(
  "/:id/reactivate",
  validateRequest(getProductByIdSchema, "params"),
  productController.reactivateProduct,
);

adminProductRouter.patch(
  "/products/:id/receive-stock",
  validateRequest(receiveStockSchema),
  productController.receiveStock,
);

adminProductRouter.patch(
  "/products/:id/remove-stock",
  validateRequest(removeStockSchema, "body"),
  productController.removeStock,
);

adminProductRouter.patch(
  "/products/:id/adjust-stock",
  validateRequest(adjustStockSchema, "body"),
  productController.adjustStock,
);
    


    
// Any authenticated user
productRouter.get(
  "/getproduct",
  validateRequest(getProductsSchema,"query"),
  productController.getProducts
);

productRouter.get(
  "/:id",
  validateRequest(getProductByIdSchema,"params"),
  productController.getProductById
);