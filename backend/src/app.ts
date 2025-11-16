import express, { Application } from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes"
import competitionsRoutes from "./routes/competitions.routes"
import adminRoutes from "./routes/admin.routes"
import docsRoutes from "./routes/docs.routes"
import { errorHandler } from "./middlewares/error.middleware"
import { apiRateLimiter } from "./middlewares/rateLimiter.middleware"
import logger from "./utils/logger"
import { env } from "./config/env"

const app: Application = express()

app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
         },
      },
      crossOriginEmbedderPolicy: false,
   })
)

app.use(
   cors({
      origin: (origin, callback) => {
         if (!origin) {
            return callback(null, true)
         }

         if (env.CLIENT_URLS.includes(origin)) {
            return callback(null, true)
         }

         callback(new Error("Not allowed by CORS"))
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
   })
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

app.use((req, res, next) => {
   logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
   })
   next()
})

app.use("/api", apiRateLimiter)

app.use("/api/auth", authRoutes)
app.use("/api/competitions", competitionsRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api-docs", docsRoutes)

app.get("/health", (req, res) => {
   res.status(200).json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
   })
})

app.use((req, res) => {
   res.status(404).json({
      success: false,
      error: {
         message: "Route not found",
         code: "NOT_FOUND",
      },
   })
})

app.use(errorHandler)

export default app
