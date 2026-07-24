import { ZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

type ValidationTarget = "body" | "query" | "params";

export function validateRequest(
  schema: ZodObject,
  target: ValidationTarget = "body"
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      schema.parse(req[target]);

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