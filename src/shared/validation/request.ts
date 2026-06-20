import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const productSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

export const stockInSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export const stockOutSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});