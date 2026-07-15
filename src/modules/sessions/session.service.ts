import { prisma } from "../../config/prisma-client";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../../shared/utils/crypto";
import { env } from "../../config/env";

export interface CreateSessionInput {
  userId: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface SessionResult {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

export const sessionService = {
  async createSession({
    userId,
    userAgent,
    ipAddress,
  }: CreateSessionInput): Promise<SessionResult> {
    // 1. Generate a secure random refresh token
    const refreshToken = generateOpaqueToken();

    // 2. Hash it before storing
    const refreshTokenHash = hashOpaqueToken(refreshToken);

    // 3. Calculate expiry date
    const expiresAt = new Date(
      Date.now() +
        env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
    );

    // 4. Create the session
    const session = await prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        userAgent: userAgent ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt,
      },
    });

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt,
    };
  },
};