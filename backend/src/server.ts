import app from "./app"
import { connectDB } from "./config/db"
import logger from "./utils/logger"
import { env } from "./config/env"

const startServer = async (): Promise<void> => {
   try {
      logger.info("Environment variables validated successfully")

      await connectDB()
      app.listen(env.PORT, () => {
         logger.info(`Server running on port ${env.PORT}`)
         logger.info(`Environment: ${env.NODE_ENV}`)
         console.log(`Server running on http://localhost:${env.PORT}`)
      })
   } catch (error) {
      logger.error("Failed to start server:", error)
      process.exit(1)
   }
}

startServer()
