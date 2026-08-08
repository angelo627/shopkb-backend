import {
  MovementReason,
  MovementType,
  Prisma,
  StockMovement,
} from "@prisma/client";

export const stockMovementInclude = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
    },
  },

  user: {
    select: {
      id: true,
      fullName: true,
    },
  },

  businessDay: {
    select: {
      id: true,
      businessDate: true,
      status: true,
    },
  },
} as const;

type StockMovementWithRelations = Prisma.StockMovementGetPayload<{
  include: typeof stockMovementInclude;
}>;

export interface StockMovementResponse {
  id: string;

  productId: string;

  product: {
    id: string;
    name: string;
    sku: string;
  };

  userId: string;

  user: {
    id: string;
    fullName: string;
  };

  businessDayId: string;

  businessDay: {
    id: string;
    businessDate: Date;
    status: string;
  };

  movementType: MovementType;

  reason: MovementReason;

  quantity: number;

  notes: string | null;

  createdAt: Date;
}

export interface StockMovementPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface StockMovementListResponse {
  items: StockMovementResponse[];

  pagination: StockMovementPagination;
}

export function toStockMovementResponse(
  movement: StockMovementWithRelations,
): StockMovementResponse {
  return {
    id: movement.id,

    productId: movement.productId,

    product: {
      id: movement.product.id,
      name: movement.product.name,
      sku: movement.product.sku,
    },

    userId: movement.userId,

    user: {
      id: movement.user.id,
      fullName: movement.user.fullName,
    },

    businessDayId: movement.businessDayId,

    businessDay: {
      id: movement.businessDay.id,
      businessDate: movement.businessDay.businessDate,
      status: movement.businessDay.status,
    },

    movementType: movement.movementType,

    reason: movement.reason,

    quantity: movement.quantity,

    notes: movement.notes,

    createdAt: movement.createdAt,
  };
}
