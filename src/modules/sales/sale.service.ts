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

// import { businessDayService } from "../businessDay/business-day.service";

import { stockMovementService } from "../stockMovement/stock-movement.service";

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

            // IMPORTANT:
            // Products are fetched INSIDE the transaction.
            const products = await tx.product.findMany({
              where: {
                id: {
                  in: productIds,
                },
                deletedAt: null,
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

            let totalAmount = new Prisma.Decimal(0);

            // Validate products and calculate total
            for (const item of items) {
              const product = products.find(
                (product) => product.id === item.productId,
              )!;

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

            // Process every product
            for (const item of items) {
              const product = products.find(
                (product) => product.id === item.productId,
              )!;

              const itemTotal = product.sellingPrice.mul(item.quantity);

              const newStockQuantity = product.stockQuantity - item.quantity;

              // Create SaleItem
              await tx.saleItem.create({
                data: {
                  saleId: createdSale.id,

                  productId: product.id,

                  quantity: item.quantity,

                  unitPrice: product.sellingPrice,

                  totalAmount: itemTotal,
                },
              });

              // Update stock
              await tx.product.update({
                where: {
                  id: product.id,
                },

                data: {
                  stockQuantity: newStockQuantity,

                  status:
                    newStockQuantity > 0
                      ? ProductStatus.AVAILABLE
                      : ProductStatus.OUT_OF_STOCK,
                },
              });

              // Record stock movement
              await stockMovementService.createMovement(
                {
                  productId: product.id,

                  userId: context.userId,

                  businessDayId: businessDay.id,

                  saleId: createdSale.id,

                  movementType: MovementType.OUT,

                  reason: MovementReason.SALE,

                  quantity: item.quantity,

                  notes: `Sale ${createdSale.id}.`,
                },
                tx,
              );
            }

            // Record one activity for the sale
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
        // PostgreSQL/Prisma serialization conflict
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
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