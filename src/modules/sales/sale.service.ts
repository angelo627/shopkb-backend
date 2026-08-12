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
import { toSaleListResponse, SaleWithDetails, PaginatedSalesResponse } from "./sale.mapper";

export interface SaleReceiptResponse {
  saleId: string;
  status: SaleStatus;
  receiptDate: Date;

  cashier: {
    id: string;
    fullName: string;
  };

  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
  }[];

  totalAmount: Prisma.Decimal;
}

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  items: CreateSaleItemInput[];
}

export interface GetSalesQuery {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  soldById?: string;
  businessDayId?: string;
  from?: string;
  to?: string;
  status?: SaleStatus;
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

  async getSales(query: GetSalesQuery): Promise<PaginatedSalesResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));

    const skip = (page - 1) * limit;

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (query.from) {
      fromDate = new Date(`${query.from}T00:00:00.000`);
    }

    if (query.to) {
      toDate = new Date(`${query.to}T00:00:00.000`);

      // Include the entire "to" date
      toDate.setDate(toDate.getDate() + 1);
    }

    const itemFilters: Prisma.SaleItemWhereInput = {};

    // Filter by product
    if (query.productId) {
      itemFilters.productId = query.productId;
    }

    // Partial product-name search
    if (query.search) {
      itemFilters.product = {
        name: {
          contains: query.search,
          mode: Prisma.QueryMode.insensitive,
        },
      };
    }

    const where: Prisma.SaleWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.soldById && {
        soldById: query.soldById,
      }),

      ...(query.businessDayId && {
        businessDayId: query.businessDayId,
      }),

      // Only add the items filter when product/search
      // filtering is actually being requested.
      ...(Object.keys(itemFilters).length > 0 && {
        items: {
          some: itemFilters,
        },
      }),

      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && {
                gte: fromDate,
              }),

              ...(toDate && {
                lt: toDate,
              }),
            },
          }
        : {}),
    };

    const [sales, totalItems] = await Promise.all([
      prisma.sale.findMany({
        where,

        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          soldBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          businessDay: {
            select: {
              id: true,
              businessDate: true,
              status: true,
            },
          },

          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),

      prisma.sale.count({
        where,
      }),
    ]);

    return {
      items: sales.map(toSaleListResponse),

      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  async getSaleById(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },

      include: {
        soldBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        //this ones i commented if its needed in the feature i will un comment it
        // businessDay: {
        //   select: {
        //     id: true,
        //     businessDate: true,
        //     status: true,
        //   },
        // },

        // items: {
        //   include: {
        //     product: {
        //       select: {
        //         id: true,
        //         name: true,
        //         sku: true,
        //       },
        //     },
        //   },
        // },

        // stockMovements: {
        //   select: {
        //     id: true,
        //     productId: true,
        //     movementType: true,
        //     reason: true,
        //     quantity: true,
        //     notes: true,
        //     createdAt: true,
        //   },
        // },
      },
    });

    if (!sale) {
      throw new AppError(404, "Sale not found.", "SALE_NOT_FOUND");
    }

    return sale;
  },

  async cancelSale(saleId: string, context: { userId: string }) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cancelledSale = await prisma.$transaction(
          async (tx) => {
            // 1. Get the sale inside the transaction
            const sale = await tx.sale.findUnique({
              where: {
                id: saleId,
              },
              select: {
                id: true,
                status: true,

                items: {
                  select: {
                    id: true,
                    productId: true,
                    quantity: true,

                    product: {
                      select: {
                        id: true,
                        stockQuantity: true,
                      },
                    },
                  },
                },
              },
            });

            if (!sale) {
              throw new AppError(404, "Sale not found.", "SALE_NOT_FOUND");
            }

            // 2. Make sure the sale has not already been cancelled
            if (sale.status === SaleStatus.CANCELLED) {
              throw new AppError(
                409,
                "Sale has already been cancelled.",
                "SALE_ALREADY_CANCELLED",
              );
            }

            // 3. Get the currently open business day
            const businessDay = await tx.businessDay.findFirst({
              where: {
                status: "OPEN",
              },
              select: {
                id: true,
              },
            });

            if (!businessDay) {
              throw new AppError(
                404,
                "No business day is currently open.",
                "BUSINESS_DAY_NOT_FOUND",
              );
            }

            // 4. Cancel the sale
            const updatedSale = await tx.sale.updateMany({
              where: {
                id: sale.id,
                status: SaleStatus.COMPLETED,
              },
              data: {
                status: SaleStatus.CANCELLED,
              },
            });

            if (updatedSale.count !== 1) {
              throw new AppError(
                409,
                "Sale has already been cancelled or could not be cancelled.",
                "SALE_CANCELLATION_CONFLICT",
              );
            }

            // 5. Restore stock
            if (sale.items.length > 0) {
              const stockUpdates = sale.items.map(
                (item) =>
                  Prisma.sql`(
                  ${item.productId}::text,
                  ${item.quantity}::integer
                )`,
              );

              const updatedProducts = await tx.$executeRaw(
                Prisma.sql`
                WITH requested(product_id, quantity) AS (
                  VALUES ${Prisma.join(stockUpdates)}
                ),
                aggregated AS (
                  SELECT
                    product_id,
                    SUM(quantity)::integer AS quantity
                  FROM requested
                  GROUP BY product_id
                )
                UPDATE "Product" AS p
                SET
                  "stockQuantity" =
                    p."stockQuantity" + aggregated.quantity,

                  "status" =
                    CASE
                      WHEN p."stockQuantity" + aggregated.quantity > 0
                        THEN 'AVAILABLE'::"ProductStatus"

                      ELSE 'OUT_OF_STOCK'::"ProductStatus"
                    END,

                  "updatedAt" = NOW()

                FROM aggregated

                WHERE p."id" = aggregated.product_id
              `,
              );

              const uniqueProductIds = new Set(
                sale.items.map((item) => item.productId),
              );

              if (updatedProducts !== uniqueProductIds.size) {
                throw new AppError(
                  500,
                  "Failed to restore product stock.",
                  "STOCK_RESTORE_FAILED",
                );
              }

              // 6. Create stock movements in one operation
              const movementData = sale.items.map((item) => ({
                productId: item.productId,

                userId: context.userId,

                businessDayId: businessDay.id,

                saleId: sale.id,

                movementType: MovementType.IN,

                reason: MovementReason.SALE_CANCELLED,

                quantity: item.quantity,

                notes: `Sale ${sale.id} cancelled.`,
              }));

              await tx.stockMovement.createMany({
                data: movementData,
              });
            }

            // 7. Activity log
            await activityLogService.createActivity(
              {
                userId: context.userId,

                businessDayId: businessDay.id,

                action: ActivityAction.SALE_CANCELLED,

                entityType: ActivityEntity.SALE,

                entityId: sale.id,

                description: `Cancelled sale "${sale.id}".`,
              },
              tx,
            );

            return updatedSale;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

            timeout: 10000,
          },
        );

        // Transaction succeeded
        const sale = await prisma.sale.findUnique({
          where: {
            id: saleId,
          },
        });

        if (!sale) {
          throw new AppError(
            404,
            "Sale not found after cancellation.",
            "SALE_NOT_FOUND",
          );
        }

        return sale;
      } catch (error) {
        // Retry serialization conflicts
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034"
        ) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 50 * attempt));

            continue;
          }

          // All retries failed
          throw new AppError(
            409,
            "The sale could not be cancelled because another transaction changed related data. Please try again.",
            "SALE_CANCELLATION_CONFLICT",
          );
        }

        // Normal application errors
        throw error;
      }
    }

    // Should never be reached
    throw new AppError(
      409,
      "The sale could not be cancelled.",
      "SALE_CANCELLATION_CONFLICT",
    );
  },

  async getSaleReceipt(saleId: string): Promise<SaleReceiptResponse> {
    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },

      select: {
        id: true,
        status: true,
        createdAt: true,
        totalAmount: true,

        soldBy: {
          select: {
            id: true,
            fullName: true,
          },
        },

        items: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            totalAmount: true,

            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new AppError(404, "Sale not found.", "SALE_NOT_FOUND");
    }

    return {
      saleId: sale.id,

      status: sale.status,

      receiptDate: sale.createdAt,

      cashier: {
        id: sale.soldBy.id,
        fullName: sale.soldBy.fullName,
      },

      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
      })),

      totalAmount: sale.totalAmount,
    };
  },
};