import { registerUser, loginUser } from "../src/services/auth.service"
import { User } from "../src/models/user.model"
import mongoose from "mongoose"
import { cleanupTestData } from "./helpers"

const MONGO_TEST_URI =
   process.env.MONGO_TEST_URI || "mongodb://localhost:27017/mini_competition_test"

describe("Auth Service", () => {
   beforeAll(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(MONGO_TEST_URI)
      }
   })

   afterAll(async () => {
      await cleanupTestData()
      await mongoose.connection.close()
   })

   beforeEach(async () => {
      await cleanupTestData()
   })

   it("should register a new user", async () => {
      const userData = {
         name: "Test User",
         email: "test@example.com",
         password: "Password123",
      }

      const user = await registerUser(userData)
      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user.passwordHash).toBeDefined()
      expect(user.role).toBe("USER")
   })

   it("should not register duplicate email", async () => {
      const userData = {
         name: "Test User",
         email: "test@example.com",
         password: "Password123",
      }

      await registerUser(userData)
      await expect(registerUser(userData)).rejects.toThrow("Email already registered")
   })

   it("should login with correct credentials", async () => {
      const userData = {
         name: "Test User",
         email: "test@example.com",
         password: "Password123",
      }

      await registerUser(userData)

      const result = await loginUser({
         email: userData.email,
         password: userData.password,
      })

      expect(result.token).toBeDefined()
      expect(result.user.email).toBe(userData.email)
      expect(result.user.role).toBe("USER")
   })

   it("should reject login with incorrect password", async () => {
      const userData = {
         name: "Test User",
         email: "test@example.com",
         password: "Password123",
      }

      await registerUser(userData)

      await expect(
         loginUser({
            email: userData.email,
            password: "WrongPassword",
         })
      ).rejects.toThrow("Invalid credentials")
   })

   it("should reject login with non-existent email", async () => {
      await expect(
         loginUser({
            email: "nonexistent@example.com",
            password: "Password123",
         })
      ).rejects.toThrow("Invalid credentials")
   })

   it("should include role in login response", async () => {
      const userData = {
         name: "Test User",
         email: "test@example.com",
         password: "Password123",
      }

      await registerUser(userData)

      const result = await loginUser({
         email: userData.email,
         password: userData.password,
      })

      expect(result.user.role).toBeDefined()
      expect(result.user.role).toBe("USER")
   })
})
