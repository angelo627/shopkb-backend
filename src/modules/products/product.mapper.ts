import { Product, ProductStatus } from "@prisma/client";

//Response Models
export interface ProductDetailResponse {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string |null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListResponse {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock: number;
  status: ProductStatus;
}

export interface ProductSalesResponse {
  id: string;
  name: string;
  sku: string;
  imageUrl: string | null;
  sellingPrice: number;
  stockQuantity: number;
  status: ProductStatus;
}

export interface DeletedProductResponse {
  id: string;
  name: string;
  sku: string;
  status: ProductStatus;
  stockQuantity: number;
  deletedAt: Date;
  createdAt: Date;
}

//Mapper Helpers
function mapProductIdentityFields(product: Product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
  };
}

function mapProductMediaFields(product: Product) {
  return {
    imageUrl: product.imageUrl,
  };
}

function mapProductPricingFields(product: Product) {
  return {
    costPrice: product.costPrice.toNumber(),
    sellingPrice: product.sellingPrice.toNumber(),
  };
}

function mapProductInventoryFields(product: Product) {
  return {
    stockQuantity: product.stockQuantity,
    minimumStock: product.minimumStock,
    status: product.status,
  };
}

function mapProductMetadataFields(product: Product) {
  return {
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

//Mappers
export function toProductDetailResponse(
  product: Product
): ProductDetailResponse {
  return {
    ...mapProductIdentityFields(product),

    description: product.description,

    ...mapProductMediaFields(product),

    ...mapProductPricingFields(product),

    ...mapProductInventoryFields(product),

    ...mapProductMetadataFields(product),
  };
}

export function toProductListResponse(
  product: Product
): ProductListResponse {
  return {
    ...mapProductIdentityFields(product),

    ...mapProductMediaFields(product),

    sellingPrice: product.sellingPrice.toNumber(),

    ...mapProductInventoryFields(product),
  };
}

export function toProductSalesResponse(
  product: Product
): ProductSalesResponse {
  return {
    ...mapProductIdentityFields(product),

    ...mapProductMediaFields(product),

    sellingPrice: product.sellingPrice.toNumber(),

    stockQuantity: product.stockQuantity,

    status: product.status,
  };
}

export function toDeletedProductResponse(
  product: Product
): DeletedProductResponse {
  return {
    ...mapProductIdentityFields(product),

    status: product.status,

    stockQuantity: product.stockQuantity,

    deletedAt: product.deletedAt!,

    createdAt: product.createdAt,
  };
}