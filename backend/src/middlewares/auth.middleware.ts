import { Request, Response, NextFunction } from "express"
import { verifyToken, JWTPayload } from "../utils/jwt"

export interface AuthRequest extends Request {
   user?: JWTPayload
}

export const authenticate = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      let token: string | undefined
      const authHeader = req.headers.authorization
      console.log("authHeader", authHeader)

      if (authHeader && authHeader.startsWith("Bearer ")) {
         token = authHeader.substring(7)
      } else if (req.cookies?.token) {
         token = req.cookies.token as string
      }

      console.log("token----------------", token)

      if (!token) {
         res.status(401).json({
            success: false,
            error: {
               message: "No token provided",
               code: "UNAUTHORIZED",
            },
         })
         return
      }

      const payload = verifyToken(token)

      req.user = payload
      next()
   } catch (error) {
      res.status(401).json({
         success: false,
         error: {
            message: "Invalid or expired token",
            code: "UNAUTHORIZED",
         },
      })
   }
}

export const optionalAuthenticate = async (
   req: AuthRequest,
   _res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      let token: string | undefined
      // console.log("req.headers----------------", req.headers)
      const authHeader = req.headers.authorization

      if (authHeader && authHeader.startsWith("Bearer ")) {
         token = authHeader.substring(7)
      } else if ((req as any).cookies?.token) {
         token = (req as any).cookies.token as string
      }

      if (token) {
         const payload = verifyToken(token)
         console.log("payload----------------", payload)
         req.user = payload
      }
   } catch (_err) {
   } finally {
      next()
   }
}