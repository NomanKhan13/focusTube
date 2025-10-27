import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

type AppError = Error & {
  statusCode: number;
  success: boolean;
  message: string;
  data?: [];
};

export default function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
) {
  const error = err as AppError;
  console.error(err);

  // Handle custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
    });
  }

  // Handle known Mongoose errors
  if (error.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Invalid ID format",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }

  // Default (catch-all)
  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: "Internal Server Error",
  });
}
