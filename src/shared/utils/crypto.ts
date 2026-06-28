import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

//Hash a plain-text password using bcrypt.
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}


// Verify a plain-text password against a bcrypt hash.
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}


//Generate a cryptographically secure, URL-safe random token.
//Useful for password reset, email verification, etc.
export function generateOpaqueToken(size = 48): string {
  return crypto.randomBytes(size).toString("base64url");
}


//Hash an opaque token using SHA-256 before storing it in the database.
export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}