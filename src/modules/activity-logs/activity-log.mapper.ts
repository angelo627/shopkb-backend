import {
  ActivityAction,
  ActivityEntity,
  // ActivityLog,
  Prisma,
} from "@prisma/client";

export interface ActivityLogResponse {
  id: string;
  userId: string;

  user: {
    id: string;
    fullName: string;
  };

  businessDayId: string | null;

  action: ActivityAction;

  entityType: ActivityEntity | null;
  entityId: string | null;

  description: string | null;

  createdAt: Date;
}

export function toActivityLogResponse(
  activity: ActivityLogWithUser,
): ActivityLogResponse {
  return {
    id: activity.id,
    userId: activity.userId,

    user: {
      id: activity.user.id,
      fullName: activity.user.fullName,
    },

    businessDayId: activity.businessDayId,

    action: activity.action,

    entityType: activity.entityType,
    entityId: activity.entityId,

    description: activity.description,

    createdAt: activity.createdAt,
  };
}

export const activityDescription = {
  productCreated(name: string) {
    return `Created product "${name}".`;
  },

  productUpdated(name: string) {
    return `Updated product "${name}".`;
  },

  productDeleted(name: string) {
    return `Deleted product "${name}".`;
  },

  productRestored(name: string) {
    return `Restored product "${name}".`;
  },

  productDeactivated(name: string) {
    return `Deactivated product "${name}".`;
  },

  productReactivated(name: string) {
    return `Reactivated product "${name}".`;
  },

  stockReceived(name: string, quantity: number) {
    return `Received ${quantity} unit(s) of "${name}".`;
  },

  stockAdjusted(name: string) {
    return `Adjusted stock for "${name}".`;
  },

  stockIn(name: string, quantity: number) {
    return `Added ${quantity} units to "${name}".`;
  },

  stockOut(name: string, quantity: number) {
    return `Removed ${quantity} units from "${name}".`;
  },

  saleCreated(quantity: number, name: string) {
    return `Sold ${quantity} unit(s) of "${name}".`;
  },

  businessDayOpened() {
    return "Opened business day.";
  },

  businessDayClosed() {
    return "Closed business day.";
  },

  login() {
    return "User logged in.";
  },

  logout() {
    return "User logged out.";
  },
};

export interface GetActivityLogsInput {
  page?: number;
  limit?: number;

  userId?: string;

  businessDayId?: string;

  action?: ActivityAction;

  entityType?: ActivityEntity;

  entityId?: string;

  from?: Date;

  to?: Date;

  search?: string;

  order?: "asc" | "desc";
}

export interface ActivityLogPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}

export interface ActivityLogsResponse {
  activities: ActivityLogResponse[];

  pagination: ActivityLogPagination;
}

type ActivityLogWithUser = Prisma.ActivityLogGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        fullName: true;
      };
    };
    // businessDay: true;
  };
}>;