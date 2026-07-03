import { NextFunction, Request, Response } from "express";

interface ApiResponseBody {
  success: boolean;
  statusCode: number;
  message: string;
  data: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiResponseBody(value: unknown): value is ApiResponseBody {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.success === "boolean" &&
    typeof value.statusCode === "number" &&
    typeof value.message === "string" &&
    Object.prototype.hasOwnProperty.call(value, "data")
  );
}

export function responseFormatter(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    // Already formatted
    if (isApiResponseBody(body)) {
      return originalJson(body);
    }

    const isErrorResponse = res.statusCode >= 400;

    if (isObject(body)) {
      const message =
        typeof body.message === "string"
          ? body.message
          : isErrorResponse
            ? "Request failed."
            : "Request completed successfully.";

        if (isErrorResponse) {
        const errorData: Record<string, unknown> = {};

        if ("code" in body) {
          errorData.code = body.code;
        }

        if ("details" in body) {
          errorData.details = body.details;
        }

        if (
          process.env.NODE_ENV !== "production" &&
          "stack" in body
        ) {
          errorData.stack = body.stack;
        }

        const normalizedData =
          Object.keys(errorData).length > 0
            ? errorData
            : ("data" in body ? body.data : null);

        return originalJson({
          success: false,
          statusCode: res.statusCode,
          message,
          data: normalizedData,
        });
      }

      const normalizedData =
        "data" in body
          ? body.data
          : body;

      return originalJson({
        success: true,
        statusCode: res.statusCode,
        message,
        data: normalizedData,
      });
    }

    return originalJson({
      success: !isErrorResponse,
      statusCode: res.statusCode,
      message: isErrorResponse
        ? "Request failed."
        : "Request completed successfully.",
      data: body ?? null,
    });
  }) as Response["json"];

  next();
}