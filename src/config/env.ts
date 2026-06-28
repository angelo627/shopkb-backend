// import dotenv from "dotenv";

// dotenv.config();

// export const env = {
//   port: Number(process.env.PORT) || 5000,
//   appBaseUrl: process.env.APP_BASE_URL || "http://localhost:5000",

//   databaseUrl: process.env.DATABASE_URL || "",

//   jwtSecret: process.env.JWT_SECRET || "",
// };

import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "DATABASE_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}`
    );
  }
}

const isProduction =
  (process.env.NODE_ENV ?? "development") === "production";

  export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  isProduction,

  port: Number(process.env.PORT ?? 5000),

  appBaseUrl:
    process.env.APP_BASE_URL ??
    "http://localhost:5000",

  clientBaseUrl:
    process.env.CLIENT_BASE_URL ??
    "http://localhost:3000",

  databaseUrl: process.env.DATABASE_URL!,

  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET!,

  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET!,

  accessTokenTtlMinutes: Number(
    process.env.ACCESS_TOKEN_TTL_MINUTES ?? 15
  ),

  refreshTokenTtlDays: Number(
    process.env.REFRESH_TOKEN_TTL_DAYS ?? 7
  ),

  corsOrigin:
    process.env.CORS_ORIGIN
      ?.split(",")
      .map((origin) => origin.trim()) ??
    ["http://localhost:3000"],

  refreshCookieName:
    process.env.REFRESH_COOKIE_NAME ??
    "shopkb_refresh_token",

  // ---------- Future Features ----------

  cloudinaryCloudName:
    process.env.CLOUDINARY_CLOUD_NAME ?? "",

  cloudinaryApiKey:
    process.env.CLOUDINARY_API_KEY ?? "",

  cloudinaryApiSecret:
    process.env.CLOUDINARY_API_SECRET ?? "",

  plunkApiKey:
    process.env.PLUNK_API_KEY ?? "",

  emailVerificationTokenSecret:
    process.env.EMAIL_VERIFICATION_TOKEN_SECRET ?? "",

  emailVerificationTtlHours: Number(
    process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24
  ),

  passwordResetTokenSecret:
    process.env.PASSWORD_RESET_TOKEN_SECRET ?? "",

  passwordResetTtlMinutes: Number(
    process.env.PASSWORD_RESET_TTL_MINUTES ?? 30
  ),
} as const;