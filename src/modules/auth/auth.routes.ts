import { Router } from "express";

import { authController } from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../shared/validation/validate-request";
import {
  registerSchema,
  loginSchema,
} from "./auth.validation";

const authRouter = Router();

// Public Routes
authRouter.post("/register", validateRequest(registerSchema), authController.register);
authRouter.post("/login", validateRequest(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout",  authController.logout);

// Protected Routes
authRouter.get("/profile", authenticate, authController.getProfile);
authRouter.post("/logout-all", authenticate, authController.logoutAll);
authRouter.get("/getallsessions", authenticate,  authController.sessions);
authRouter.post("/sessions/:sessionId/revoke", authenticate, authController.revokeSession);

export { authRouter };