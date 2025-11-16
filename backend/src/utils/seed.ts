import mongoose from "mongoose"
import dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"
import { connectDB } from "../config/db"
import { Competition, ICompetition } from "../models/competition.model"
import { Candle } from "../models/candle.model"
import { User } from "../models/user.model"
import { Participation } from "../models/participation.model"
import { Transaction } from "../models/transaction.model"
import { generateAndSaveCandles } from "./chartGenerator"
import { hashPassword } from "./password"

dotenv.config()

interface CompetitionSeedData {
   name: string
   description?: string
   entryFee: number
   prizePool: number
   maxParticipants?: number
   startsAt?: string
   endsAt?: string
}

interface UserSeedData {
   name: string
   email: string
   password: string
   role: "USER" | "ADMIN"
}

function randomInt(min: number, max: number): number {
   return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateName(index: number): string {
   const firstNames = [
      "Aisha","Omar","Rohan","Fatima","Noah","Liam","Emma","Ava","Mia","Sophia",
      "Layla","Zara","Amir","Ibrahim","Youssef","Hassan","Maryam","Sofia","Huda","Sara",
   ]
   const lastNames = [
      "Khan","Patel","Ali","Hussain","Ahmed","Singh","Sharma","Farooq","Rahman","Ansari",
      "Qureshi","Mirza","Sheikh","Siddiqui","Chaudhry","Ilyas","Yusuf","Zaman","Kazmi","Rehman",
   ]
   const first = firstNames[index % firstNames.length]
   const last = lastNames[index % lastNames.length]
   return `${first} ${last}`
}

function generateEmail(index: number): string {
   const domains = ["example.com", "innohive.test", "mail.test", "demo.local"]
   const domain = domains[index % domains.length]
   return `user${index + 1}@${domain}`
}

const seed = async (): Promise<void> => {
   try {
      await connectDB()

      const competitionsPath = path.join(__dirname, "../../infra/seed/competitions.json")
      let competitionsData: CompetitionSeedData[] = []

      if (fs.existsSync(competitionsPath)) {
         const fileContent = fs.readFileSync(competitionsPath, "utf-8")
         competitionsData = JSON.parse(fileContent)
         console.log(`📖 Read ${competitionsData.length} competitions from JSON file`)
      } else {
         console.log("⚠️  JSON file not found, using default competitions")
         competitionsData = [
            {
               name: "Crypto Sprint",
               entryFee: 10,
               prizePool: 1000,
               maxParticipants: 100,
            },
            { name: "Altcoin Rush", entryFee: 20, prizePool: 1500, maxParticipants: 200 },
            { name: "DeFi Dash", entryFee: 5, prizePool: 500, maxParticipants: 50 },
            { name: "NFT Frenzy", entryFee: 15, prizePool: 1200, maxParticipants: 150 },
            {
               name: "Bitcoin Blitz",
               entryFee: 25,
               prizePool: 2000,
               maxParticipants: 100,
            },
            {
               name: "Ethereum Elite",
               entryFee: 30,
               prizePool: 2500,
               maxParticipants: 150,
            },
            { name: "Solana Sprint", entryFee: 12, prizePool: 800, maxParticipants: 80 },
            { name: "Polygon Power", entryFee: 8, prizePool: 600, maxParticipants: 60 },
         ]
      }

      console.log("Clearing existing data...")
      await Participation.deleteMany({})
      await Competition.deleteMany({})
      await Candle.deleteMany({})

      console.log("Creating users...")
      const usersToCreate: UserSeedData[] = [
         {
            name: "Admin User",
            email: "admin@gmail.com",
            password: "Admin123!",
            role: "ADMIN",
         },
      ]

      const NUM_USERS = parseInt(process.env.SEED_NUM_USERS || "200")
      const USERS_DAYS = parseInt(process.env.SEED_USERS_DAYS || "365")
      const COMP_DAYS = parseInt(process.env.SEED_COMP_DAYS || "180")
      const PARTICIPATION_DAYS = parseInt(process.env.SEED_PARTICIPATION_DAYS || "90")
      const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "User123!"
      for (let i = 0; i < NUM_USERS; i++) {
         usersToCreate.push({
            name: generateName(i),
            email: generateEmail(i),
            password: DEFAULT_PASSWORD,
            role: "USER",
         })
      }

      for (const userData of usersToCreate) {
         const existingUser = await User.findOne({ email: userData.email })
         if (!existingUser) {
            const passwordHash = await hashPassword(userData.password)
            const createdAt = new Date(Date.now() - Math.floor(Math.random() * USERS_DAYS) * 24 * 3600 * 1000)
            const balance = userData.role === "USER" ? randomInt(50, 5000) : undefined
            const exposure = userData.role === "USER" ? randomInt(50, 1000) : undefined
            const user = new User({
               name: userData.name,
               email: userData.email.toLowerCase(),
               passwordHash,
               passwordText: userData.password,
               role: userData.role,
               walletBalance: balance,
               exposure: exposure,
               createdAt,
            })
            await user.save()
            if (user.role === "USER" && (balance ?? 0) > 0) {
               await Transaction.create({
                  userId: user._id,
                  type: "CREDIT",
                  amount: balance ?? 0,
                  balanceBefore: 0,
                  balanceAfter: balance ?? 0,
                  description: "Initial wallet funding",
                  createdAt,
               })
               const extraTopups = randomInt(0, 3)
               for (let t = 0; t < extraTopups; t++) {
                  const amount = randomInt(10, 200)
                  const topupAt = new Date(createdAt.getTime() + randomInt(1, USERS_DAYS) * 24 * 3600 * 1000)
                  await User.updateOne({ _id: user._id }, { $inc: { walletBalance: amount } })
                  await Transaction.create({
                     userId: user._id,
                     type: "CREDIT",
                     amount,
                     description: "Top-up",
                     createdAt: topupAt,
                  })
               }
            }
            console.log(` Created ${userData.role}: ${userData.email}`)
         } else {
            console.log(`  User already exists: ${userData.email}`)
         }
      }

      console.log("Creating competitions...")
      const competitionsToInsert = competitionsData.map((comp) => {
         const slug = comp.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "")

         const createdAt = new Date(Date.now() - Math.floor(Math.random() * COMP_DAYS) * 24 * 3600 * 1000)
         const startsAt =
            Math.random() < 0.7
               ? new Date(createdAt.getTime() + randomInt(-15, 30) * 24 * 3600 * 1000)
               : undefined
         const endsAt = startsAt ? new Date(startsAt.getTime() + randomInt(7, 30) * 24 * 3600 * 1000) : undefined

         return {
            name: comp.name,
            slug,
            description: comp.description,
            entryFee: comp.entryFee,
            prizePool: comp.prizePool,
            maxParticipants: comp.maxParticipants,
            startsAt: comp.startsAt ? new Date(comp.startsAt) : startsAt,
            endsAt: comp.endsAt ? new Date(comp.endsAt) : endsAt,
            createdAt,
         }
      })

      const createdCompetitions = await Competition.insertMany(competitionsToInsert)
      console.log(`Created ${createdCompetitions.length} competitions`)

      console.log("Generating chart data...")
      for (let i = 0; i < createdCompetitions.length; i++) {
         const competition = createdCompetitions[i]
         const competitionId = competition._id.toString()

         const existingCandles = await Candle.countDocuments({ competitionId })
         if (existingCandles > 0) {
            console.log(`Chart data already exists for: ${competition.name}`)
            continue
         }

         await generateAndSaveCandles({
            competitionId,
            count: 120,
            interval: 86400,
            basePrice: 100 + i * 10,
            volatility: 0.02 + i * 0.005,
            seed: i * 1000,
         })

         console.log(`Generated chart data for: ${competition.name}`)
      }

      console.log("Creating participations...")
      const allUsers = await User.find({ role: "USER" })
      let totalParticipations = 0
      for (const competition of createdCompetitions as ICompetition[]) {
         const entryFee = competition.entryFee ?? 0
         const configuredMax = competition.maxParticipants ?? randomInt(80, 300)
         const cap = Math.min(149, configuredMax)

         const existingCount = await Participation.countDocuments({
            competitionId: competition._id,
         })

         const desiredTotal = Math.min(
            cap,
            randomInt(Math.max(1, Math.floor(cap * 0.6)), Math.max(1, cap))
         )
         const targetToAdd = Math.max(0, desiredTotal - existingCount)
         if (targetToAdd === 0) {
            console.log(
               `  ⏭️  ${competition.name}: already at cap (${existingCount}/${cap})`
            )
            continue
         }

         const shuffled = allUsers.slice().sort(() => Math.random() - 0.5)
         let added = 0
         for (const user of shuffled) {
            if (added >= targetToAdd) break
            const canAfford = (user.walletBalance ?? 0) >= entryFee
            if (!canAfford) continue

            const exists = await Participation.findOne({
               userId: user._id,
               competitionId: competition._id,
            })
            if (exists) continue

            const windowStart = competition.startsAt ?? new Date(Date.now() - PARTICIPATION_DAYS * 24 * 3600 * 1000)
            const windowEnd = competition.endsAt ?? new Date()
            const startMs = Math.min(windowStart.getTime(), Date.now() - PARTICIPATION_DAYS * 24 * 3600 * 1000)
            const endMs = Math.max(windowEnd.getTime(), Date.now())
            const joinedAt = new Date(randomInt(startMs, endMs))
            if (entryFee > 0) {
               const beforeAvail = (user.walletBalance ?? 0) - (user.exposure ?? 0)
               const debit = await User.updateOne(
                  { _id: user._id, walletBalance: { $gte: entryFee } },
                  { $inc: { walletBalance: -entryFee } }
               )
               if (debit.modifiedCount !== 1) continue
               await Transaction.create({
                  userId: user._id,
                  type: "DEBIT",
                  amount: entryFee,
                  balanceBefore: beforeAvail,
                  balanceAfter: beforeAvail - entryFee,
                  competitionId: competition._id,
                  description: `Seed: entry fee debited for ${competition.name}`,
                  createdAt: joinedAt,
               })
            }

            await Participation.create({
               userId: user._id,
               competitionId: competition._id,
               joinedAt,
            })

            added += 1
            totalParticipations += 1
         }

         console.log(
            `   ${competition.name}: added ${added} participants (cap ${cap})`
         )
      }

      console.log(`Total participations created: ${totalParticipations}`)

      console.log("\n Seeding completed successfully!")
      console.log("\n Default credentials:")
      console.log("   Admin: admin@gmail.com / Admin123!")
      process.exit(0)
   } catch (error) {
      console.error(" Error seeding:", error)
      process.exit(1)
   }
}

seed()
