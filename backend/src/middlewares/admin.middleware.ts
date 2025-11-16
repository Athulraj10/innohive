import { Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"

export const checkAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
   try {
      if (!req.user) {
         res.status(401).json({
            success: false,
            error: {
               message: "Unauthorized",
               code: "UNAUTHORIZED",
            },
         })
         return
      }
      if (req.user.role !== "ADMIN") {
         res.status(403).json({
            success: false,
            error: {
               message: "Forbidden: Admin access required",
               code: "FORBIDDEN",
            },
         })
         return
      }

      next()
   } catch (error) {
      res.status(500).json({
         success: false,
         error: {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
         },
      })
   }
}
