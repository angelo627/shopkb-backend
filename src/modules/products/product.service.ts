import { Product, ProductStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { AppError } from "../../shared/errors/app-error";
import {
  ProductDetailResponse,
  toProductDetailResponse,
} from "./product.mapper";
import { uploadImage } from "../../shared/utils/upload-image";
import { ProductListResponse, toProductListResponse } from "./product.mapper";
import type { GetProductsQuery } from "./product.validation";

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

export const productService = {
  async createProduct(
    input: CreateProductInput,
  ): Promise<ProductDetailResponse> {
    // Normalize input
    const name = input.name.trim();
    const sku = input.sku.trim().toUpperCase();
    const description = input.description?.trim() || null;

    let imageUrl: string | null = null;

    if (input.imageFile) {
      const uploadedImage = await uploadImage(
        input.imageFile.buffer,
        "shopkb/products",
      );

      imageUrl = uploadedImage.secure_url;
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

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        imageUrl,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        stockQuantity,
        minimumStock,
        status: determineProductStatus(stockQuantity),
      },
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
};