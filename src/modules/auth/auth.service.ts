import { User, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";
import { hashPassword, verifyPassword } from "../../shared/utils/crypto";
import {
  AccessTokenPayload,
  signAccessToken,
} from "../../shared/utils/token";

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
        status: "ACTIVE",
      },
    });

    return toAuthenticatedUser(user);
  },

  async login(input: LoginInput): Promise<AuthenticationResult> {
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

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as AccessTokenPayload["role"],
      status: user.status as AccessTokenPayload["status"],
    });

    return {
      user: toAuthenticatedUser(user),
      accessToken,
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
};