import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { AppError, ValidationError } from "../utils/errors"
import { ResponseHelper } from "../utils/response"
import mongoose from "mongoose"
import { env } from "../config/env"

export const errorHandler = (
   err: Error | AppError,
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   logger.error("Error occurred:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      ...(err instanceof AppError && { statusCode: err.statusCode, code: err.code }),
   })

   if (err instanceof AppError) {
      if (err instanceof ValidationError) {
         ResponseHelper.error(res, err.message, err.statusCode, err.code, err.fields)
         return
      }
      ResponseHelper.error(res, err.message, err.statusCode, err.code)
      return
   }

   if (err instanceof mongoose.Error.ValidationError) {
      const fields: Record<string, string[]> = {}
      Object.keys(err.errors).forEach((key) => {
         fields[key] = [err.errors[key].message]
      })
      ResponseHelper.error(res, "Validation failed", 400, "VALIDATION_ERROR", fields)
      return
   }

   if ((err as any).code === 11000) {
      const field = Object.keys((err as any).keyPattern || {})[0] || "field"
      ResponseHelper.error(res, `${field} already exists`, 409, "DUPLICATE_KEY")
      return
   }

   if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      ResponseHelper.error(res, "Invalid or expired token", 401, "INVALID_TOKEN")
      return
   }

   if (err instanceof mongoose.Error.CastError) {
      ResponseHelper.error(res, "Invalid resource ID", 400, "INVALID_ID")
      return
   }

   const message = env.NODE_ENV === "production" ? "Internal server error" : err.message

   ResponseHelper.error(res, message, 500, "INTERNAL_ERROR")
}
