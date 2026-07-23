import { Router } from "express";
import { productController } from "./product.controller";
import { uploadProductImage } from "../../middlewares/upload.middleware";
import { validateRequest } from "../../shared/validation/validate-request"
import { createProductSchema } from "../products/product.validation"



export const productRouter = Router();

productRouter.post("/createproducts",
     uploadProductImage.single("image"),
     validateRequest(createProductSchema),
     productController.createProduct
    );