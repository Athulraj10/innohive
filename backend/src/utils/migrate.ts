import mongoose from "mongoose"
import dotenv from "dotenv"
import { User } from "../models/user.model"

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mini_competition"

async function migrateUsers() {
   try {
      console.log("Connecting to database...")
      await mongoose.connect(MONGO_URI)
      console.log("Connected to database")

      const usersWithoutRole = await User.find({
         $or: [{ role: { $exists: false } }, { role: null }, { role: undefined }],
      })

      console.log(`Found ${usersWithoutRole.length} users without role field`)

      if (usersWithoutRole.length === 0) {
         console.log("No users need migration. All users already have roles.")
         await mongoose.connection.close()
         return
      }

      const result = await User.updateMany(
         {
            $or: [{ role: { $exists: false } }, { role: null }, { role: undefined }],
         },
         {
            $set: { role: "USER" },
         }
      )

      console.log(
         `Migration complete! Updated ${result.modifiedCount} users with default 'USER' role.`
      )
      console.log('All existing users now have the role field set to "USER"')

      await mongoose.connection.close()
      console.log("Database connection closed")
   } catch (error) {
      console.error("Migration failed:", error)
      process.exit(1)
   }
}

if (require.main === module) {
   migrateUsers()
      .then(() => {
         console.log("Migration script completed successfully")
         process.exit(0)
      })
      .catch((error) => {
         console.error("Migration script failed:", error)
         process.exit(1)
      })
}

export { migrateUsers }
