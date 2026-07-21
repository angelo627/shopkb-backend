import { Router } from "express";
import { productController } from "./product.controller";


export const productRouter = Router();

productRouter.post("/createproducts", productController.createProduct);