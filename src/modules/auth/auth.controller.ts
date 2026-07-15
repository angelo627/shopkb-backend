import { Request, Response } from "express";

import { authService } from "./auth.service";
import { asyncHandler } from "../../shared/utils/async-handler";
import { setRefreshTokenCookie } from "../../shared/utils/cookies";

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: result,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, {
      userAgent: req.get("user-agent") ?? undefined,
      ipAddress: req.ip,
    });

    // Store the refresh token in an HttpOnly cookie
    setRefreshTokenCookie(res, result.refreshToken);

    // Remove the refresh token from the response body
    const { refreshToken, ...data } = result;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data,
    });
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("Authenticated user not found.");
    }

    const result = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: result,
    });
  }),
};