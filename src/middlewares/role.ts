import { Request, Response, NextFunction } from "express";

export const role =
  (...roles: string[]) =>
  (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };