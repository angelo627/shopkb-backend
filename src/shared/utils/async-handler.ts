import {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from "express";

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(
  handler: AsyncRequestHandler
): RequestHandler {
  return (req, res, next): void => {
    void handler(req, res, next).catch(next);
  };
}