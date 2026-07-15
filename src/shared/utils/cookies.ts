import { Response } from "express";

import { env } from "../../config/env";

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string
): void {
  res.cookie(env.refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge:
      env.refreshTokenTtlDays *
      24 *
      60 *
      60 *
      1000,
    path: "/",
  });
}

export function clearRefreshTokenCookie(
  res: Response
): void {
  res.clearCookie(env.refreshCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  });
}