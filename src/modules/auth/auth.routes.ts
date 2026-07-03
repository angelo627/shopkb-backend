import { Router } from "express";

import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const authRouter = Router();

// Public Routes
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);

// Protected Routes
authRouter.get("/profile", authenticate, authController.getProfile);

export { authRouter };