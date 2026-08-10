import { MovementReason, MovementType } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";
import { DbClient } from "../../types/db-client";

import {
  StockMovementListResponse,
  StockMovementResponse,
  stockMovementInclude,
  toStockMovementResponse,
} from "./stock-movement.mapper";

import type { GetStockMovementsQuery } from "./stock-movement.validation";

export interface CreateStockMovementInput {
  productId: string;

  userId: string;

  businessDayId: string;

  saleId?: string;

  movementType: MovementType;

  reason: MovementReason;

  quantity: number;

  notes?: string | null;
}


export const stockMovementService = {
  async createMovement(
    input: CreateStockMovementInput,
    db: DbClient = prisma,
  ): Promise<StockMovementResponse> {
    if (input.quantity <= 0) {
      throw new AppError(
        400,
        "Quantity must be greater than zero.",
        "INVALID_QUANTITY",
      );
    }

    const notes = input.notes?.trim() || null;

    const movement = await db.stockMovement.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        businessDayId: input.businessDayId,

        saleId: input.saleId ?? null,

        movementType: input.movementType,
        reason: input.reason,

        quantity: input.quantity,
        notes,
      },

      include: stockMovementInclude,
    });

    return toStockMovementResponse(movement);
  },

  async getStockMovements(
    query: GetStockMovementsQuery,
  ): Promise<StockMovementListResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 10);

    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {
      ...(query.productId && {
        productId: query.productId,
      }),

      ...(query.userId && {
        userId: query.userId,
      }),

      ...(query.businessDayId && {
        businessDayId: query.businessDayId,
      }),

      ...(query.movementType && {
        movementType: query.movementType,
      }),

      ...(query.reason && {
        reason: query.reason,
      }),

      ...(query.search && {
        product: {
          OR: [
            {
              name: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              sku: {
                contains: query.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        },
      }),

      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && {
            gte: query.from,
          }),

          ...(query.to && {
            lte: query.to,
          }),
        },
      }),
    };

    const [movements, totalItems] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,

        include: stockMovementInclude,

        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.stockMovement.count({
        where,
      }),
    ]);

    return {
      items: movements.map(toStockMovementResponse),

      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  async getStockMovementById(id: string): Promise<StockMovementResponse> {
     const movement = await prisma.stockMovement.findUnique({
       where: {
         id,
       },
 
       include: stockMovementInclude,
     });
 
     if (!movement) {
       throw new AppError(
         404,
         "Stock movement not found.",
         "STOCK_MOVEMENT_NOT_FOUND",
       );
     }
 
     return toStockMovementResponse(movement);
    },
};