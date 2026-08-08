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

import { businessDayService } from "../businessDay/business-day.service";

import { stockMovementService } from "../stockMovement/stock-movement.service";

export interface CreateSaleInput {
  productId: string;
  quantity: number;
}
