import { NextFunction, Request, Response } from "express";

import { AppError } from "../shared/errors/app-error";
import { UserRole } from "../shared/constants/auth";
import { verifyAccessToken } from "../shared/utils/token";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return next(
      new AppError(
        401,
        "Authentication required.",
        "UNAUTHORIZED"
      )
    );
  }

  const token = authorizationHeader.substring("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);

    if (payload.status !== "ACTIVE") {
      return next(
        new AppError(
          403,
          "Your account is not active.",
          "ACCOUNT_NOT_ACTIVE"
        )
      );
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
    };

    return next();
  } catch {
    return next(
      new AppError(
        401,
        "Invalid or expired access token.",
        "UNAUTHORIZED"
      )
    );
  }
}

export function authorize(...roles: UserRole[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(
        new AppError(
          401,
          "Authentication required.",
          "UNAUTHORIZED"
        )
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "You do not have permission to perform this action.",
          "FORBIDDEN"
        )
      );
    }

    return next();
  };
}