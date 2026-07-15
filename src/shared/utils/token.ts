import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UserRole, UserStatus } from "../constants/auth";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  sessionId: string;
  type: "access";
} 

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
}

//Generate an Access Token.
export function signAccessToken(
  payload: Omit<AccessTokenPayload, "type">
): string {
  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    env.accessTokenSecret,
    {
      expiresIn: `${env.accessTokenTtlMinutes}m`,
    }
  );
}


// Generate a Refresh Token.
export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">
): string {
  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    env.refreshTokenSecret,
    {
      expiresIn: `${env.refreshTokenTtlDays}d`,
    }
  );
}

//Verify an Access Token.
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(
    token,
    env.accessTokenSecret
  ) as AccessTokenPayload;

  if (payload.type !== "access") {
    throw new Error("Invalid access token type.");
  }

  return payload;
}

// Verify a Refresh Token.
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(
    token,
    env.refreshTokenSecret
  ) as RefreshTokenPayload;

  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token type.");
  }

  return payload;
}