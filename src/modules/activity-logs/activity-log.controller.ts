import { Request, Response } from "express";

import { ActivityAction, ActivityEntity } from "@prisma/client";

import { asyncHandler } from "../../shared/utils/async-handler";

import { activityLogService } from "./activity-log.service";

import { GetActivityLogsInput } from "./activity-log.mapper";

export const activityLogController = {
  getActivityLogs: asyncHandler(async (req: Request, res: Response) => {
    const input: GetActivityLogsInput = {};

    if (req.query.page !== undefined) {
      input.page = Number(req.query.page);
    }

    if (req.query.limit !== undefined) {
      input.limit = Number(req.query.limit);
    }

    if (req.query.userId) {
      input.userId = req.query.userId as string;
    }

    if (req.query.businessDayId) {
      input.businessDayId = req.query.businessDayId as string;
    }

    if (req.query.action) {
      input.action = req.query.action as ActivityAction;
    }

    if (req.query.entityType) {
      input.entityType = req.query.entityType as ActivityEntity;
    }

    if (req.query.entityId) {
      input.entityId = req.query.entityId as string;
    }

    if (req.query.from) {
      input.from = new Date(req.query.from as string);
    }

    if (req.query.to) {
      input.to = new Date(req.query.to as string);
    }

    if (req.query.search) {
      input.search = req.query.search as string;
    }

    if (req.query.order) {
      input.order = req.query.order as "asc" | "desc";
    }

    const result = await activityLogService.getActivityLogs(input);

    res.status(200).json({
      success: true,
      message: "Activities retrieved successfully.",
      data: result,
    });
  }),
};
