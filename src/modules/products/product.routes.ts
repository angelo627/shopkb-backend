import { Router } from "express";
import { productController } from "./product.controller";
import { uploadProductImage } from "../../middlewares/upload.middleware";
import { validateRequest } from "../../shared/validation/validate-request";
import { createProductSchema } from "../products/product.validation";
import { getProductsSchema,
         getProductByIdSchema,
         updateProductSchema
} from "../products/product.validation";

export const productRouter = Router();
export const adminProductRouter = Router();
// export const superAdminProductRouter = Router();  , eventually i will create this 

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