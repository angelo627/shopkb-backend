import { Request, Response } from "express";
import { env } from "../../config/env";
import { authService } from "./auth.service";
import { AppError } from "../../shared/errors/app-error";
import { asyncHandler } from "../../shared/utils/async-handler";
import { setRefreshTokenCookie, clearRefreshTokenCookie } from "../../shared/utils/cookies";

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

    // Don't expose the refresh token in the response body
    const { refreshToken, ...data } = result;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data,
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[env.refreshCookieName];

    if (!refreshToken) {
      throw new AppError(
        401,
        "Refresh token is missing.",
        "REFRESH_TOKEN_MISSING"
      );
    }

    const result = await authService.refresh(refreshToken);

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      data: result,
    });
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        401,
        "Authenticated user not found.",
        "UNAUTHENTICATED"
      );
    }

    const result = await authService.getProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully.",
      data: result,
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[env.refreshCookieName];

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  }),
};