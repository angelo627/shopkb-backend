import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must not exceed 100 characters."),

  email: z
    .string()
    .trim()
    .email("Invalid email address.")
    .transform(email => email.toLowerCase()),

  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must not exceed 128 characters."),
    // .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    // .regex(/[a-z]/, "Password must contain a lowercase letter.")
    // .regex(/\d/, "Password must contain a number.")
    // .regex(/[^A-Za-z0-9]/, "Password must contain a special character."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address.")
    .transform(email => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required."),
});