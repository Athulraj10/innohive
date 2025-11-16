import { Request, Response, NextFunction } from "express"

interface RateLimitStore {
   [key: string]: {
      count: number
      resetTime: number
   }
}

const store: RateLimitStore = {}

interface RateLimitOptions {
   windowMs: number
   max: number
   message?: string
   skipSuccessfulRequests?: boolean
}

export const rateLimiter = (options: RateLimitOptions) => {
   const {
      windowMs,
      max,
      message = "Too many requests, please try again later",
      skipSuccessfulRequests = false,
   } = options

   return (req: Request, res: Response, next: NextFunction): void => {
      // Skip rate limiting in test environment
      if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined) {
         return next()
      }

      const key = req.ip || req.socket.remoteAddress || "unknown"
      const now = Date.now()

      Object.keys(store).forEach((k) => {
         if (store[k].resetTime < now) {
            delete store[k]
         }
      })

      const record = store[key]

      if (!record || record.resetTime < now) {
         store[key] = {
            count: 1,
            resetTime: now + windowMs,
         }
         return next()
      }

      if (record.count >= max) {
         const retryAfter = Math.ceil((record.resetTime - now) / 1000)
         res.setHeader("Retry-After", retryAfter.toString())
         res.status(429).json({
            success: false,
            error: {
               message,
               code: "RATE_LIMIT_EXCEEDED",
            },
         })
         return
      }

      record.count++
      next()
   }
}

export const authRateLimiter = rateLimiter({
   windowMs: 15 * 60 * 1000,
   max: 50,
   message: "Too many authentication attempts, please try again later",
})

export const apiRateLimiter = rateLimiter({
   windowMs: 1 * 60 * 1000,
   max: 100,
})
