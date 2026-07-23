import { ZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

export function validateRequest(schema: ZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            error.issues.map(issue => issue.message).join(", "),
            "VALIDATION_ERROR"
          )
        );
      }

      next(error);
    }
  };
}