import {
  ActivityAction,
  ActivityEntity,
  MovementReason,
  MovementType,
  ProductStatus,
  SaleStatus,
} from "@prisma/client";

import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";

import { activityLogService } from "../activity-logs/activity-log.service";
import { activityDescription } from "../activity-logs/activity-log.mapper";


export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
}



export const saleService = {
  async createSale(context: { userId: string }, input: CreateSaleInput) {
    if (input.items.length === 0) {
      throw new AppError(
        400,
        "At least one product is required.",
        "SALE_ITEMS_REQUIRED",
      );
    }

    // Check for duplicate products
    const productIds = input.items.map((item) => item.productId);

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      throw new AppError(
        400,
        "A product cannot appear more than once in a sale.",
        "DUPLICATE_PRODUCT",
      );
    }

    // Process products in a consistent order.
    // This helps reduce deadlock risk when two sales
    // contain some of the same products.
    const items = [...input.items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const sale = await prisma.$transaction(
          async (tx) => {
            // Get the open business day inside the transaction
            const businessDay = await tx.businessDay.findFirst({
              where: {
                status: "OPEN",
              },
            });

            if (!businessDay) {
              throw new AppError(
                404,
                "No business day is currently open.",
                "BUSINESS_DAY_NOT_FOUND",
              );
            }

            // Fetch all requested products inside the transaction
            const products = await tx.product.findMany({
              where: {
                id: {
                  in: productIds,
                },
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                sellingPrice: true,
                stockQuantity: true,
                status: true,
              },
            });

            // Make sure every requested product exists
            if (products.length !== productIds.length) {
              throw new AppError(
                404,
                "One or more products were not found.",
                "PRODUCT_NOT_FOUND",
              );
            }

            // Create a Map for fast product lookup
            const productMap = new Map(
              products.map((product) => [product.id, product]),
            );

            let totalAmount = new Prisma.Decimal(0);

            // Validate products and calculate total
            for (const item of items) {
              const product = productMap.get(item.productId);

              if (!product) {
                throw new AppError(
                  404,
                  "Product not found.",
                  "PRODUCT_NOT_FOUND",
                );
              }

              if (product.status === ProductStatus.INACTIVE) {
                throw new AppError(
                  400,
                  `Product "${product.name}" is inactive and cannot be sold.`,
                  "PRODUCT_INACTIVE",
                );
              }

              if (product.stockQuantity < item.quantity) {
                throw new AppError(
                  400,
                  `Insufficient stock for "${product.name}".`,
                  "INSUFFICIENT_STOCK",
                );
              }

              const itemTotal = product.sellingPrice.mul(item.quantity);

              totalAmount = totalAmount.add(itemTotal);
            }

            // Create the main Sale
            const createdSale = await tx.sale.create({
              data: {
                soldById: context.userId,

                businessDayId: businessDay.id,

                status: SaleStatus.COMPLETED,

                totalAmount,
              },
            });

            // CREATE ALL SALE ITEMS IN ONE DATABASE OPERATION
            const saleItemData = items.map((item) => {
              const product = productMap.get(item.productId)!;

              const itemTotal = product.sellingPrice.mul(item.quantity);

              return {
                saleId: createdSale.id,

                productId: product.id,

                quantity: item.quantity,

                unitPrice: product.sellingPrice,

                totalAmount: itemTotal,
              };
            });

            await tx.saleItem.createMany({
              data: saleItemData,
            });

            // UPDATE ALL PRODUCT STOCK IN ONE DATABASE OPERATION
            const stockUpdates = items.map(
              (item) =>
                Prisma.sql`(${item.productId}, ${item.quantity}::integer)`,
            );

            const updatedProducts = await tx.$executeRaw(
              Prisma.sql`
               WITH requested(product_id, quantity) AS (
                 VALUES ${Prisma.join(stockUpdates)}
               )
               UPDATE "Product" AS p
               SET
                 "stockQuantity" = p."stockQuantity" - requested.quantity,
           
                 "status" = CASE
                   WHEN p."stockQuantity" - requested.quantity > 0
                     THEN 'AVAILABLE'::"ProductStatus"
           
                   ELSE 'OUT_OF_STOCK'::"ProductStatus"
                 END
           
               FROM requested
           
               WHERE p."id" = requested.product_id
           
                 AND p."deletedAt" IS NULL
           
                 AND p."status" <> 'INACTIVE'::"ProductStatus"
           
                 AND p."stockQuantity" >= requested.quantity
             `,
            );

            // Make sure every requested product was updated
            if (updatedProducts !== items.length) {
              throw new AppError(
                400,
                "One or more products do not have enough stock or cannot be sold.",
                "STOCK_UPDATE_FAILED",
              );
            }

            // CREATE ALL STOCK MOVEMENTS IN ONE DATABASE OPERATION
            const movementData = items.map((item) => {
              const product = productMap.get(item.productId)!;

              return {
                productId: product.id,

                userId: context.userId,

                businessDayId: businessDay.id,

                saleId: createdSale.id,

                movementType: MovementType.OUT,

                reason: MovementReason.SALE,

                quantity: item.quantity,

                notes: `Sale ${createdSale.id}.`,
              };
            });

            await tx.stockMovement.createMany({
              data: movementData,
            });

            // RECORD ONE ACTIVITY FOR THE ENTIRE SALE
            await activityLogService.createActivity(
              {
                userId: context.userId,

                businessDayId: businessDay.id,

                action: ActivityAction.SALE_CREATED,

                entityType: ActivityEntity.SALE,

                entityId: createdSale.id,

                description: activityDescription.saleCreated(items.length),
              },
              tx,
            );

            return createdSale;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

            timeout: 10000,
          },
        );

        return sale;
      } catch (error) {
        const isPrismaSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";

        const isPostgresSerializationConflict =
          error instanceof Error &&
          "code" in error &&
          (error as { code?: string }).code === "40001";

        if (
          (isPrismaSerializationConflict || isPostgresSerializationConflict) &&
          attempt < maxRetries
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new AppError(
      409,
      "The sale could not be completed because another transaction changed the stock. Please try again.",
      "SALE_CONFLICT",
    );
  },
};