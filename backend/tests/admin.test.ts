import request from "supertest"
import mongoose from "mongoose"
import { User } from "../src/models/user.model"
import { Competition } from "../src/models/competition.model"
import { Participation } from "../src/models/participation.model"
import { registerUser, loginUser } from "../src/services/auth.service"
import { createCompetition } from "../src/services/competition.service"
import { hashPassword } from "../src/utils/password"
import app from "../src/app"

const MONGO_TEST_URI =
   process.env.MONGO_TEST_URI || "mongodb://localhost:27017/mini_competition_test"

describe("Admin API Tests", () => {
   let adminToken: string
   let userToken: string
   let adminUser: any
   let regularUser: any
   let testCompetition: any

   beforeAll(async () => {
      if (mongoose.connection.readyState === 0) {
         await mongoose.connect(MONGO_TEST_URI)
      }
   })

   beforeEach(async () => {
      // Recreate users and competition for each test since global beforeEach cleans them
      const adminPasswordHash = await hashPassword("Admin123!")
      adminUser = await User.create({
         name: "Admin User",
         email: "admin@test.com",
         passwordHash: adminPasswordHash,
         role: "ADMIN",
      })

      const userPasswordHash = await hashPassword("User123!")
      regularUser = await User.create({
         name: "Regular User",
         email: "user@test.com",
         passwordHash: userPasswordHash,
         role: "USER",
      })

      const adminLogin = await loginUser({
         email: "admin@test.com",
         password: "Admin123!",
      })
      adminToken = adminLogin.token

      const userLogin = await loginUser({
         email: "user@test.com",
         password: "User123!",
      })
      userToken = userLogin.token

      testCompetition = await createCompetition({
         name: "Test Competition",
         description: "Test Description",
         entryFee: 10,
         prizePool: 100,
         maxParticipants: 50,
         createdBy: adminUser._id.toString(),
      })
   })

   afterAll(async () => {
      await User.deleteMany({})
      await Competition.deleteMany({})
      await Participation.deleteMany({})
      await mongoose.connection.close()
   })

   describe("Admin Middleware - Role-Based Access", () => {
      it("should allow admin to create competition via admin route", async () => {
         const competitionData = {
            name: "Admin Test Competition",
            entryFee: 10,
            prizePool: 100,
         }

         const response = await request(app)
            .post("/api/admin/competitions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(competitionData)
            .expect(201)

         expect(response.body.success).toBe(true)
         expect(response.body.data).toBeDefined()
      })

      it("should return 403 for non-admin users accessing admin routes", async () => {
         const competitionData = {
            name: "Unauthorized Competition",
            entryFee: 10,
            prizePool: 100,
         }

         const response = await request(app)
            .post("/api/admin/competitions")
            .set("Authorization", `Bearer ${userToken}`)
            .send(competitionData)
            .expect(403)

         expect(response.body.success).toBe(false)
         expect(response.body.error).toBeDefined()
         expect(response.body.error.message).toContain("Admin access required")
      })

      it("should return 401 for unauthenticated requests", async () => {
         const response = await request(app).get("/api/admin/competitions").expect(401)

         expect(response.body.error).toBeDefined()
      })
   })

   describe("Admin Competition CRUD", () => {
      let createdCompetitionId: string

      it("should create a competition as admin", async () => {
         const competitionData = {
            name: "New Admin Competition",
            description: "Created by admin",
            entryFee: 25,
            prizePool: 500,
            maxParticipants: 100,
         }

         const response = await request(app)
            .post("/api/admin/competitions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(competitionData)
            .expect(201)

         expect(response.body.data).toBeDefined()
         expect(response.body.data.name).toBe(competitionData.name)
         expect(response.body.data.entryFee).toBe(competitionData.entryFee)
         expect(response.body.data.prizePool).toBe(competitionData.prizePool)
         expect(response.body.data.createdBy).toBe(adminUser._id.toString())

         createdCompetitionId = response.body.data._id
      })

      it("should update a competition as admin", async () => {
         const updateData = {
            name: "Updated Competition Name",
            prizePool: 750,
         }

         const response = await request(app)
            .put(`/api/admin/competitions/${testCompetition._id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send(updateData)
            .expect(200)

         expect(response.body.data).toBeDefined()
         expect(response.body.data.name).toBe(updateData.name)
         expect(response.body.data.prizePool).toBe(updateData.prizePool)
      })

      it("should not allow non-admin to create competition", async () => {
         const competitionData = {
            name: "Unauthorized Competition",
            entryFee: 10,
            prizePool: 100,
         }

         const response = await request(app)
            .post("/api/admin/competitions")
            .set("Authorization", `Bearer ${userToken}`)
            .send(competitionData)
            .expect(403)

         expect(response.body.error).toBeDefined()
      })

      it("should delete a competition as admin", async () => {
         const compToDelete = await createCompetition({
            name: "To Be Deleted",
            entryFee: 5,
            prizePool: 50,
            createdBy: adminUser._id.toString(),
         })

         const response = await request(app)
            .delete(`/api/admin/competitions/${compToDelete._id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(204)

         const deleted = await Competition.findById(compToDelete._id)
         expect(deleted).toBeNull()
      })

      it("should validate competition data on create", async () => {
         const invalidData = {
            name: "",
            entryFee: -10,
            prizePool: 100,
         }

         const response = await request(app)
            .post("/api/admin/competitions")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(invalidData)
            .expect(400)

         expect(response.body.error).toBeDefined()
      })
   })

   describe("Participant Listing", () => {
      let competitionWithParticipants: any

      beforeEach(async () => {
         // Create competition and participation in beforeEach since global beforeEach cleans data
         competitionWithParticipants = await createCompetition({
            name: "Competition with Participants",
            entryFee: 10,
            prizePool: 200,
            createdBy: adminUser._id.toString(),
         })

         await Participation.create({
            userId: regularUser._id,
            competitionId: competitionWithParticipants._id,
         })
      })

      it("should list participants for a competition as admin", async () => {
         const response = await request(app)
            .get(
               `/api/admin/competitions/${competitionWithParticipants._id}/participants`
            )
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(200)

         expect(response.body.data).toBeDefined()
         expect(response.body.data.participants).toBeInstanceOf(Array)
         expect(response.body.data.participants.length).toBeGreaterThan(0)
         expect(response.body.data.participants[0].userId).toBeDefined()
         expect(response.body.data.participants[0].userId.name).toBe(regularUser.name)
         expect(response.body.data.participants[0].userId.email).toBe(regularUser.email)
      })

      it("should not allow non-admin to view participants", async () => {
         const response = await request(app)
            .get(
               `/api/admin/competitions/${competitionWithParticipants._id}/participants`
            )
            .set("Authorization", `Bearer ${userToken}`)
            .expect(403)

         expect(response.body.error).toBeDefined()
      })

      it("should return 404 for non-existent competition", async () => {
         const fakeId = new mongoose.Types.ObjectId()
         const response = await request(app)
            .get(`/api/admin/competitions/${fakeId}/participants`)
            .set("Authorization", `Bearer ${adminToken}`)
            .expect(404)

         expect(response.body.error).toBeDefined()
      })
   })

   describe("Role-Based Access Control", () => {
      it("should include role in JWT token", async () => {
         const response = await request(app)
            .post("/api/auth/login")
            .send({
               email: "admin@test.com",
               password: "Admin123!",
            })
            .expect(200)

         expect(response.body.data.user.role).toBe("ADMIN")
      })

      it("should include USER role for regular users", async () => {
         const response = await request(app)
            .post("/api/auth/login")
            .send({
               email: "user@test.com",
               password: "User123!",
            })
            .expect(200)

         expect(response.body.data.user.role).toBe("USER")
      })
   })
})
