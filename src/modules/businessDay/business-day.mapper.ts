import { BusinessDay, BusinessDayStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";


type BusinessDayWithUsers = Prisma.BusinessDayGetPayload<{
  include: {
    openedBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
    closedBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
  };
}>;

// reusable for service 
export const businessDayInclude = {
  openedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
  closedBy: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const;

export interface BusinessDayResponse {
  id: string;

  businessDate: Date;

  status: BusinessDayStatus;

  openedById: string | null;
  closedById: string | null;

  openedBy: {
    id: string;
    fullName: string;
  } | null;

  closedBy: {
    id: string;
    fullName: string;
  } | null;

  openedAt: Date;
  closedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessDayPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BusinessDayListResponse {
  data: BusinessDayResponse[];
  pagination: BusinessDayPagination;
}

export function toBusinessDayResponse(
  businessDay: BusinessDayWithUsers,
): BusinessDayResponse {
  return {
    id: businessDay.id,

    businessDate: businessDay.businessDate,

    status: businessDay.status,

    openedById: businessDay.openedById,

    closedById: businessDay.closedById,

    openedBy: businessDay.openedBy
      ? {
          id: businessDay.openedBy.id,
          fullName: businessDay.openedBy.fullName,
        }
      : null,

    closedBy: businessDay.closedBy
      ? {
          id: businessDay.closedBy.id,
          fullName: businessDay.closedBy.fullName,
        }
      : null,

    openedAt: businessDay.openedAt,
    closedAt: businessDay.closedAt,

    createdAt: businessDay.createdAt,
    updatedAt: businessDay.updatedAt,
  };
}