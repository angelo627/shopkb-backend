import { Router } from "express";

import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const authRouter = Router();

// Public Routes
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);

// Protected Routes
authRouter.get("/profile", authenticate, authController.getProfile);

export { authRouter };