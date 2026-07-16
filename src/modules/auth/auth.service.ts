import { User, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";
import { hashPassword, verifyPassword } from "../../shared/utils/crypto";
import {
  AccessTokenPayload,
  signAccessToken,
} from "../../shared/utils/token";
import { sessionService } from "../sessions/session.service";

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role?: AccessTokenPayload["role"];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: AccessTokenPayload["role"];
  status: AccessTokenPayload["status"];
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

function toAuthenticatedUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: User["role"];
  status: User["status"];
}): AuthenticatedUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as AccessTokenPayload["role"],
    status: user.status as AccessTokenPayload["status"],
  };
}

function ensureUserCanAuthenticate(status: UserStatus): void {
  switch (status) {
    case "ACTIVE":
      return;

    case "PENDING":
      throw new AppError(
        403,
        "Your account is pending activation.",
        "ACCOUNT_PENDING"
      );

    case "SUSPENDED":
      throw new AppError(
        403,
        "Your account has been suspended.",
        "ACCOUNT_SUSPENDED"
      );

    case "DISABLED":
      throw new AppError(
        403,
        "Your account has been disabled.",
        "ACCOUNT_DISABLED"
      );
  }
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthenticatedUser> {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new AppError(
        409,
        "An account with this email already exists.",
        "EMAIL_ALREADY_EXISTS"
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        role: input.role ?? "STAFF",
        status: "PENDING",
      },
    });

    return toAuthenticatedUser(user);
  },

  async login(input: LoginInput, context: LoginContext): Promise<AuthenticationResult> {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new AppError(
        401,
        INVALID_CREDENTIALS_MESSAGE,
        "INVALID_CREDENTIALS"
      );
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new AppError(
        401,
        INVALID_CREDENTIALS_MESSAGE,
        "INVALID_CREDENTIALS"
      );
    }

    ensureUserCanAuthenticate(user.status);

    const session = await sessionService.createSession({
    userId: user.id,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as AccessTokenPayload["role"],
      status: user.status as AccessTokenPayload["status"],
      sessionId: session.sessionId
    });

    return {
      user: toAuthenticatedUser(user),
      accessToken,
      refreshToken: session.refreshToken
    };
  },

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    return toAuthenticatedUser(user);
  },

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const session = 
      await sessionService.findSessionByRefreshToken(refreshToken);

      if (!session) {
        throw new AppError(
          401,
          "Invalid refresh token.",
          "INVALID_REFRESH_TOKEN"
        );
      }

      if (session.revokedAt) {
        throw new AppError(
          401,
          "Session has been revoked.",
          "SESSION_REVOKED"
        );
      }

      if (session.expiresAt.getTime() < Date.now()) {
        throw new AppError(
          401,
          "Refresh token has expired.",
          "REFRESH_TOKEN_EXPIRED"
        );
      }

      ensureUserCanAuthenticate(session.user.status);

      await sessionService.touchSession(session.id);


      const accessToken = signAccessToken({
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role as AccessTokenPayload["role"],
        status: session.user.status as AccessTokenPayload["status"],
        sessionId: session.id
      });

      return {
        accessToken,
      };
  },

  async logout(refreshToken: string): Promise<void> {
  await sessionService.revokeSessionByRefreshToken(refreshToken);
  }
};