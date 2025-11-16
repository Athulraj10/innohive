import { Request, Response, NextFunction } from "express"
import { body, validationResult } from "express-validator"
import { registerUser, loginUser, getUserById } from "../services/auth.service"
import { AuthRequest } from "../middlewares/auth.middleware"
import { ResponseHelper } from "../utils/response"
import { ValidationError } from "../utils/errors"
import { Transaction } from "../models/transaction.model"

export const validateRegister = [
   body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
   body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required")
      .isLength({ max: 100 })
      .withMessage("Email must be less than 100 characters"),
   body("password")
      .isLength({ min: 8, max: 100 })
      .withMessage("Password must be between 8 and 100 characters")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage("Password must contain at least one letter and one number"),
]

export const validateLogin = [
   body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
   body("password").notEmpty().withMessage("Password is required"),
]

const handleValidationErrors = (
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   const errors = validationResult(req)
   if (!errors.isEmpty()) {
      const fields: Record<string, string[]> = {}
      errors.array().forEach((error: any) => {
         const field = error.path || error.param
         if (!fields[field]) {
            fields[field] = []
         }
         fields[field].push(error.msg)
      })
      throw new ValidationError("Validation failed", fields)
   }
   next()
}

export const register = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { name, email, password } = req.body

      const user = await registerUser({ name, email, password })

      const { generateToken } = await import("../utils/jwt")
      const token = generateToken({
         id: user._id.toString(),
         email: user.email,
         role: user.role,
      })

     
      const { env } = await import("../config/env")
      const { calculateCookieMaxAge } = await import("../utils/jwt")
      const isProduction = env.NODE_ENV === "production"

      res.cookie("token", token, {
         httpOnly: true,
         secure: isProduction,
         sameSite: isProduction ? "none" : "lax",
         maxAge: calculateCookieMaxAge(env.JWT_EXPIRES_IN),
         path: "/",
      })

      ResponseHelper.success(
         res,
         {
            token,
            user: {
               _id: user._id.toString(),
               name: user.name,
               email: user.email,
               role: user.role,
               walletBalance: user.walletBalance ?? 100,
               exposure: user.exposure ?? 0,
            },
         },
         201
      )
   } catch (error) {
      next(error)
   }
}

export const login = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { email, password } = req.body

      const result = await loginUser({ email, password })

      const { env } = await import("../config/env")
      const { calculateCookieMaxAge } = await import("../utils/jwt")
      const isProduction = env.NODE_ENV === "production"

      res.cookie("token", result.token, {
         httpOnly: true,
         secure: isProduction,
         sameSite: isProduction ? "none" : "lax",
         maxAge: calculateCookieMaxAge(env.JWT_EXPIRES_IN),
         path: "/",
      })

      ResponseHelper.success(res, result, 200)
   } catch (error) {
      next(error)
   }
}

export const me = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      if (!req.user) {
         ResponseHelper.error(res, "Unauthorized", 401, "UNAUTHORIZED")
         return
      }

      const user = await getUserById(req.user.id)

      ResponseHelper.success(
         res,
         {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            walletBalance: user.walletBalance ?? 100,
            exposure: user.exposure ?? 0,
         },
         200
      )
   } catch (error) {
      next(error)
   }
}

export const logout = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      res.clearCookie("token", {
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
         path: "/",
      })

      ResponseHelper.success(
         res,
         {
            message: "Logged out successfully",
         },
         200
      )
   } catch (error) {
      next(error)
   }
}

export { handleValidationErrors }

export const getMyTransactions = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      if (!req.user) {
         ResponseHelper.error(res, "Unauthorized", 401, "UNAUTHORIZED")
         return
      }
      const page = Math.max(1, parseInt((req.query.page as string) || "1"))
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "10")))
      const skip = (page - 1) * limit
      const [rows, total] = await Promise.all([
         Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
         Transaction.countDocuments({ userId: req.user.id }),
      ])
      ResponseHelper.success(res, rows, 200, { page, limit, total })
   } catch (error) {
      next(error)
   }
}
