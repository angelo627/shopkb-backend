import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy.",
  });
});

router.use("/auth", authRouter);

export default router;