import { Router } from "express";
import { productController } from "./product.controller";
import { uploadProductImage } from "../../middlewares/upload.middleware";
import { validateRequest } from "../../shared/validation/validate-request";
import { createProductSchema } from "../products/product.validation";
import { getProductsSchema,
         getProductByIdSchema
 } from "../products/product.validation";

export const productRouter = Router();
export const adminProductRouter = Router();

// ADMIN & SUPERADMIN
adminProductRouter.post("/createproducts",
     uploadProductImage.single("image"),
     validateRequest(createProductSchema),
     productController.createProduct
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