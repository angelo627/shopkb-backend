import {
  ActivityAction,
  ActivityEntity,
  ActivityLog,
} from "@prisma/client";

export interface ActivityLogResponse {
  id: string;
  userId: string;

  businessDayId: string | null;

  action: ActivityAction;

  entityType: ActivityEntity | null;
  entityId: string | null;

  description: string | null;

  createdAt: Date;
}

export function toActivityLogResponse(
  activity: ActivityLog,
): ActivityLogResponse {
  return {
    id: activity.id,
    userId: activity.userId,

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

  stockReceived(name: string, quantity: number) {
    return `Received ${quantity} unit(s) of "${name}".`;
  },

  stockAdjusted(name: string) {
    return `Adjusted stock for "${name}".`;
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