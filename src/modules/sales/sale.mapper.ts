import { Prisma } from "@prisma/client";

export type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    soldBy: {
      select: {
        id: true;
        fullName: true;
        email: true;
      };
    };

    businessDay: {
      select: {
        id: true;
        businessDate: true;
        status: true;
      };
    };

    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            sku: true;
          };
        };
      };
    };
  };
}>;

export function toSaleListResponse(sale: SaleWithDetails) {
  return {
    id: sale.id,

    status: sale.status,

    soldBy: {
      id: sale.soldBy.id,
      fullName: sale.soldBy.fullName,
      email: sale.soldBy.email,
    },

    businessDay: {
      id: sale.businessDay.id,
      businessDate: sale.businessDay.businessDate,
      status: sale.businessDay.status,
    },

    totalAmount: sale.totalAmount.toString(),

    items: sale.items.map((item) => ({
      id: item.id,

      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
      },

      quantity: item.quantity,

      unitPrice: item.unitPrice.toString(),

      totalAmount: item.totalAmount.toString(),
    })),

    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
}


export interface PaginatedSalesResponse {
  items: ReturnType<typeof toSaleListResponse>[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}