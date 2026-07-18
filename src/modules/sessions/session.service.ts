import { prisma } from "../../config/prisma-client";
import {
  generateOpaqueToken,
  hashOpaqueToken,
} from "../../shared/utils/crypto";
import { env } from "../../config/env";
import { date } from "zod";
import { AppError } from "../../shared/errors/app-error"

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
      Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
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

  async findSessionByRefreshToken(refreshToken: string) {
    const refreshTokenHash = hashOpaqueToken(refreshToken);

    return prisma.session.findFirst({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    });
  },

  async touchSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  },

  async rotateRefreshToken(sessionId: string): Promise<SessionResult> {
    const refreshToken = generateOpaqueToken();

    const refreshTokenHash = hashOpaqueToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    );

    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return {
      sessionId,
      refreshToken,
      expiresAt,
    };
  },

  // change refreshtoken 
  async revokeSessionByRefreshToken(refreshToken: string): Promise<void> {
    const refreshTokenHash = hashOpaqueToken(refreshToken);

    await prisma.session.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  },

  // logout of all devices or revoke all access
  async revokeAllUserSessions(userId: string): Promise<void> {
   await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
   });
  },

  //revoke a user particullar session but mostly not needed
  async revokeSession(
    sessionId: string,
    userId: string
  ): Promise<void> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  
    if (!session) {
      throw new AppError(
        404,
        "Session not found.",
        "SESSION_NOT_FOUND"
      );
    }
  
    if (session.revokedAt) {
      throw new AppError(
        400,
        "Session has already been revoked.",
        "SESSION_ALREADY_REVOKED"
      );
    }
  
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  //to remove unwanted refreshtoken
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();

    const THIRTY_DAYS_AGO = new Date(
     now.getTime() -
     env.sessionRetentionDays * 24 * 60 * 60 * 1000
    );

    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: now,
            },
          },
          {
            revokedAt: {
              lt: THIRTY_DAYS_AGO,
            },
          },
        ],
      },
    });
  
    return result.count;
  },
};