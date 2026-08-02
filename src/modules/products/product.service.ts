import { Product, ProductStatus, ActivityAction, ActivityEntity } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";
import {
  ProductDetailResponse,
  toProductDetailResponse,
  DeletedProductResponse,
  toDeletedProductResponse,
  ProductListResponse,
  toProductListResponse
} from "./product.mapper";
import { uploadImage, deleteImage } from "../../shared/utils/upload-image";
import type { GetProductsQuery } from "./product.validation";
import { activityLogService } from "../activity-logs/activity-log.service";
import { activityDescription } from "../activity-logs/activity-description";
import { BusinessDayStatus } from "@prisma/client";
import { businessDayService } from "../businessDay/business-day.service";

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string | undefined;
  imageFile?: Express.Multer.File | undefined;
  costPrice: number;
  sellingPrice: number;
  stockQuantity?: number | undefined;
  minimumStock?: number | undefined;
}

// export interface GetProductsQuery {
//   page?: number | undefined;
//   limit?: number | undefined;
//   search?: string | undefined;
//   status?: ProductStatus | undefined;
// }

export interface PaginatedProductsResponse {
  items: ProductListResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string | undefined;
  imageFile?: Express.Multer.File | undefined;

  costPrice?: number;
  sellingPrice?: number;
  minimumStock?: number;
}

export interface ProductActionContext {
  userId: string;
}

function determineProductStatus(
  stockQuantity: number
): ProductStatus {
  return stockQuantity > 0
    ? ProductStatus.AVAILABLE
    : ProductStatus.OUT_OF_STOCK;
}

// have not implemented this helper function
function ensureProductCanBeSold(product: Product): void {
  switch (product.status) {
    case ProductStatus.AVAILABLE:
      return;

    case ProductStatus.OUT_OF_STOCK:
      throw new AppError(
        400,
        "This product is out of stock.",
        "PRODUCT_OUT_OF_STOCK"
      );

    case ProductStatus.INACTIVE:
      throw new AppError(
        400,
        "This product is inactive and cannot be sold.",
        "PRODUCT_INACTIVE"
      );
  }
}

async function getOpenBusinessDay() {
  const businessDay = await prisma.businessDay.findFirst({
    where: {
      status: BusinessDayStatus.OPEN,
    },
  });

  if (!businessDay) {
    throw new AppError(
      404,
      "No business day is currently open.",
      "BUSINESS_DAY_NOT_FOUND",
    );
  }

  return businessDay;
}

export const productService = {
  async createProduct(
    context: ProductActionContext,
    input: CreateProductInput,
  ): Promise<ProductDetailResponse> {
    // Normalize input
    const name = input.name.trim();
    const sku = input.sku.trim().toUpperCase();
    const description = input.description?.trim() || null;

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    if (input.imageFile) {
      const uploadedImage = await uploadImage(
        input.imageFile.buffer,
        "shopkb/products",
      );

      imageUrl = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
    }

    const stockQuantity = input.stockQuantity ?? 0;
    const minimumStock = input.minimumStock ?? 0;

    // Validate input
    if (!name) {
      throw new AppError(
        400,
        "Product name is required.",
        "INVALID_PRODUCT_NAME",
      );
    }

    if (!sku) {
      throw new AppError(400, "SKU is required.", "INVALID_SKU");
    }

    if (input.costPrice < 0) {
      throw new AppError(
        400,
        "Cost price cannot be negative.",
        "INVALID_COST_PRICE",
      );
    }

    if (input.sellingPrice < 0) {
      throw new AppError(
        400,
        "Selling price cannot be negative.",
        "INVALID_SELLING_PRICE",
      );
    }

    if (stockQuantity < 0) {
      throw new AppError(
        400,
        "Stock quantity cannot be negative.",
        "INVALID_STOCK_QUANTITY",
      );
    }

    if (minimumStock < 0) {
      throw new AppError(
        400,
        "Minimum stock cannot be negative.",
        "INVALID_MINIMUM_STOCK",
      );
    }

    if (input.sellingPrice < input.costPrice) {
      throw new AppError(
        400,
        "Selling price cannot be less than cost price.",
        "INVALID_SELLING_PRICE",
      );
    }

    // Check SKU uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: {
        sku,
      },
    });

    if (existingProduct) {
      throw new AppError(
        409,
        "A product with this SKU already exists.",
        "PRODUCT_ALREADY_EXISTS",
      );
    }

    const businessDay = await businessDayService.requireOpenBusinessDay();

    // Create product
    const product = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          sku,
          description,
          imageUrl,
          imagePublicId,
          costPrice: input.costPrice,
          sellingPrice: input.sellingPrice,
          stockQuantity,
          minimumStock,
          status: determineProductStatus(stockQuantity),
        },
      });

      await activityLogService.createActivity(
        {
          userId: context.userId,

          businessDayId: businessDay.id,

          action: ActivityAction.PRODUCT_CREATED,

          entityType: ActivityEntity.PRODUCT,

          entityId: product.id,

          description: activityDescription.productCreated(product.name),
        },
        tx,
      );

      return product;
    });

    return toProductDetailResponse(product);
  },

  async getProducts(
    query: GetProductsQuery,
  ): Promise<PaginatedProductsResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 10);

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,

      ...(query.status && {
        status: query.status,
      }),

      ...(query.search && {
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
      }),
    };

    const [products, totalItems] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.product.count({
        where,
      }),
    ]);

    return {
      items: products.map(toProductListResponse),

      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  async getProductById(productId: string): Promise<ProductDetailResponse> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new AppError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    }

    return toProductDetailResponse(product);
  },

  async updateProduct(
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductDetailResponse> {
    // Find product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new AppError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    }

    // Normalize incoming values
    const name = input.name?.trim() ?? product.name;
    const sku = input.sku?.trim().toUpperCase() ?? product.sku;
    const description =
      input.description !== undefined
        ? input.description.trim()
        : product.description;

    const costPrice = input.costPrice ?? product.costPrice.toNumber();

    const sellingPrice = input.sellingPrice ?? product.sellingPrice.toNumber();

    const minimumStock = input.minimumStock ?? product.minimumStock;

    // Validate
    if (!name) {
      throw new AppError(
        400,
        "Product name is required.",
        "INVALID_PRODUCT_NAME",
      );
    }

    if (!sku) {
      throw new AppError(400, "SKU is required.", "INVALID_SKU");
    }

    if (costPrice < 0) {
      throw new AppError(
        400,
        "Cost price cannot be negative.",
        "INVALID_COST_PRICE",
      );
    }

    if (sellingPrice < 0) {
      throw new AppError(
        400,
        "Selling price cannot be negative.",
        "INVALID_SELLING_PRICE",
      );
    }

    if (minimumStock < 0) {
      throw new AppError(
        400,
        "Minimum stock cannot be negative.",
        "INVALID_MINIMUM_STOCK",
      );
    }

    if (sellingPrice < costPrice) {
      throw new AppError(
        400,
        "Selling price cannot be less than cost price.",
        "INVALID_SELLING_PRICE",
      );
    }

    // Ensure SKU is unique if changed
    if (sku !== product.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku },
      });

      if (existing) {
        throw new AppError(
          409,
          "A product with this SKU already exists.",
          "PRODUCT_ALREADY_EXISTS",
        );
      }
    }

    // Preserve current image
    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;

    // Upload replacement image if supplied
    if (input.imageFile) {
      const uploadedImage = await uploadImage(
        input.imageFile.buffer,
        "shopkb/products",
      );

      imageUrl = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
    }

    // Update database
    const updatedProduct = await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        name,
        sku,
        description,
        imageUrl,
        imagePublicId,
        costPrice,
        sellingPrice,
        minimumStock,
      },
    });

    // Delete old image only after successful update
    if (input.imageFile && product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    return toProductDetailResponse(updatedProduct);
  },

  async deleteProduct(productId: string): Promise<DeletedProductResponse> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new AppError(
        404, 
        "Product not found.",
        "PRODUCT_NOT_FOUND"
      );
    }

    const deletedProduct = await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return toDeletedProductResponse(deletedProduct);
  },

  async deactivateProduct(
    productId: string,
    context: ProductActionContext,
  ): Promise<ProductDetailResponse> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new AppError(
        404,
       "Product not found.",
       "PRODUCT_NOT_FOUND"
      );
    }

    // Idempotent: already inactive
    if (product.status === ProductStatus.INACTIVE) {
      return toProductDetailResponse(product);
    }

    const businessDay = await businessDayService.getCurrentBusinessDayOrNull();

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          status: ProductStatus.INACTIVE,
        },
      });

      await activityLogService.createActivity(
        {
          userId: context.userId,

          businessDayId: businessDay?.id ?? null,

          action: ActivityAction.PRODUCT_DEACTIVATED,

          entityType: ActivityEntity.PRODUCT,

          entityId: updated.id,

          description: activityDescription.productDeactivated(updated.name),
        },
        tx,
      );

      return updated;
    });

    return toProductDetailResponse(updatedProduct);
  },
};