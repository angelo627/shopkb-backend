import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma-client";

export type DbClient = Prisma.TransactionClient | typeof prisma;