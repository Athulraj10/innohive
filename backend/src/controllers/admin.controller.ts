import { Request, Response, NextFunction } from "express"
import { body, validationResult } from "express-validator"
import {
   createCompetition,
   updateCompetition,
   deleteCompetition,
   getCompetitionParticipants,
} from "../services/competition.service"
import { getAllUsers, getUserDetails } from "../services/admin.service"
import { ResponseHelper } from "../utils/response"
import { AuthRequest } from "../middlewares/auth.middleware"
import mongoose from "mongoose"
import { User } from "../models/user.model"
import { Competition } from "../models/competition.model"
import { Participation } from "../models/participation.model"
import { Transaction } from "../models/transaction.model"
import { ValidationError } from "../utils/errors"

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

export const createCompetitionAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      if (!req.user) {
         ResponseHelper.error(res, "Unauthorized", 401, "UNAUTHORIZED")
         return
      }

      const {
         name,
         description,
         entryFee,
         prizePool,
         maxParticipants,
         startsAt,
         endsAt,
      } = req.body

      const competition = await createCompetition({
         name: name?.trim(),
         description: description?.trim(),
         entryFee: parseFloat(entryFee),
         prizePool: parseFloat(prizePool),
         maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
         startsAt: startsAt ? new Date(startsAt) : undefined,
         endsAt: endsAt ? new Date(endsAt) : undefined,
         createdBy: req.user.id,
      })

      ResponseHelper.success(res, competition, 201)
   } catch (error) {
      next(error)
   }
}

export const updateCompetitionAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params
      const {
         name,
         description,
         entryFee,
         prizePool,
         maxParticipants,
         startsAt,
         endsAt,
      } = req.body

      const updateData: {
         name?: string
         description?: string
         entryFee?: number
         prizePool?: number
         maxParticipants?: number
         startsAt?: Date
         endsAt?: Date
      } = {}

      if (name !== undefined && name !== null && name !== "") {
         updateData.name = typeof name === "string" ? name.trim() : name
      }
      
      if (description !== undefined && description !== null) {
         updateData.description = description.trim() || undefined
      }
      
      if (entryFee !== undefined && entryFee !== null && entryFee !== "") {
         updateData.entryFee = parseFloat(entryFee)
      }
      
      if (prizePool !== undefined && prizePool !== null && prizePool !== "") {
         updateData.prizePool = parseFloat(prizePool)
      }
      
      if (maxParticipants !== undefined && maxParticipants !== null && maxParticipants !== "") {
         const parsed = parseInt(maxParticipants)
         updateData.maxParticipants = !isNaN(parsed) ? parsed : undefined
      } else if (maxParticipants === "" || maxParticipants === null) {
         updateData.maxParticipants = undefined
      }
      
      if (startsAt !== undefined && startsAt !== null && startsAt !== "") {
         updateData.startsAt = new Date(startsAt)
      } else if (startsAt === "" || startsAt === null) {
         updateData.startsAt = undefined
      }
      
      if (endsAt !== undefined && endsAt !== null && endsAt !== "") {
         updateData.endsAt = new Date(endsAt)
      } else if (endsAt === "" || endsAt === null) {
         updateData.endsAt = undefined
      }

      const competition = await updateCompetition(id, updateData)

      ResponseHelper.success(res, competition, 200)
   } catch (error) {
      next(error)
   }
}

export const deleteCompetitionAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params

      await deleteCompetition(id)

      res.status(204).send()
   } catch (error) {
      next(error)
   }
}

export const getParticipants = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params

      const participants = await getCompetitionParticipants(id)

      ResponseHelper.success(res, { participants }, 200)
   } catch (error) {
      next(error)
   }
}

export const getAllUsersAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const page = req.query.page ? parseInt(String(req.query.page)) : 1
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10
      const search = req.query.search ? String(req.query.search) : undefined
      const role =
         req.query.role && (req.query.role === "ADMIN" || req.query.role === "USER")
            ? (req.query.role as "ADMIN" | "USER")
            : undefined

      const { users, meta } = await getAllUsers({ page, limit, search, role })

      ResponseHelper.success(res, { users }, 200, { page: meta.page, limit: meta.limit, total: meta.total })
   } catch (error) {
      next(error)
   }
}

export const getUserDetailsAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params
      const userDetails = await getUserDetails(id)

      ResponseHelper.success(res, userDetails, 200)
   } catch (error) {
      next(error)
   }
}

export const validateCreateCompetition = [
   body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3, max: 100 })
      .withMessage("Name must be between 3 and 100 characters"),
   body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
   body("entryFee")
      .isFloat({ min: 0 })
      .withMessage("Entry fee must be a non-negative number"),
   body("prizePool")
      .isFloat({ min: 0 })
      .withMessage("Prize pool must be a non-negative number"),
   body("maxParticipants")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max participants must be at least 1"),
   body("startsAt")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO 8601 date"),
   body("endsAt")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO 8601 date")
      .custom((value, { req }) => {
         if (req.body.startsAt && new Date(value) <= new Date(req.body.startsAt)) {
            throw new Error("End date must be after start date")
         }
         return true
      }),
]

export const validateUpdateCompetition = [
   body("name")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const trimmed = String(value).trim()
            if (!trimmed || trimmed.length < 3) {
               throw new Error("Name must be at least 3 characters")
            }
            if (trimmed.length > 100) {
               throw new Error("Name must be less than 100 characters")
            }
         }
         return true
      }),
   body("description")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const trimmed = String(value).trim()
            if (trimmed.length > 500) {
               throw new Error("Description must be less than 500 characters")
            }
         }
         return true
      }),
   body("entryFee")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const num = parseFloat(String(value))
            if (isNaN(num)) {
               throw new Error("Entry fee must be a valid number")
            }
            if (num < 0) {
               throw new Error("Entry fee must be non-negative")
            }
         }
         return true
      }),
   body("prizePool")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const num = parseFloat(String(value))
            if (isNaN(num)) {
               throw new Error("Prize pool must be a valid number")
            }
            if (num < 0) {
               throw new Error("Prize pool must be non-negative")
            }
         }
         return true
      }),
   body("maxParticipants")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const num = parseInt(String(value))
            if (isNaN(num)) {
               throw new Error("Max participants must be a valid number")
            }
            if (num < 1) {
               throw new Error("Max participants must be at least 1")
            }
         }
         return true
      }),
   body("startsAt")
      .optional()
      .custom((value) => {
         if (value !== undefined && value !== null && value !== "") {
            const date = new Date(String(value))
            if (isNaN(date.getTime())) {
               throw new Error("Start date must be a valid ISO 8601 date")
            }
         }
         return true
      }),
   body("endsAt")
      .optional()
      .custom((value, { req }) => {
         if (value !== undefined && value !== null && value !== "") {
            const date = new Date(String(value))
            if (isNaN(date.getTime())) {
               throw new Error("End date must be a valid ISO 8601 date")
            }
            if (req.body.startsAt && req.body.startsAt !== "" && new Date(value) <= new Date(req.body.startsAt)) {
               throw new Error("End date must be after start date")
            }
         }
         return true
      }),
]

export { handleValidationErrors }

export const getAdminTimeSeries = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const from = req.query.from ? parseInt(String(req.query.from)) : undefined
      const to = req.query.to ? parseInt(String(req.query.to)) : undefined
      const granularity = (req.query.granularity as string) === "month" ? "month" : "day"
      const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000)
      const end = to ? new Date(to) : new Date()

      const matchCreatedAt = { $match: { createdAt: { $gte: start, $lte: end } } }
      const matchJoinedAt = { $match: { joinedAt: { $gte: start, $lte: end } } }
      const format = granularity === "month" ? "%Y-%m" : "%Y-%m-%d"
      const dayProject = {
         $project: {
            day: {
               $dateToString: { format, date: "$createdAt" },
            },
            createdAt: 1,
         },
      }
      const dayGroup = { $group: { _id: "$day", count: { $sum: 1 } } }
      const sortByDay: any = { $sort: { _id: 1 as 1 } }

      const [usersAgg, competitionsAgg, participationsAgg] = await Promise.all([
         User.aggregate([matchCreatedAt, dayProject, dayGroup, sortByDay]),
         Competition.aggregate([matchCreatedAt, dayProject, dayGroup, sortByDay]),
         Participation.aggregate([
            matchJoinedAt,
            { $project: { day: { $dateToString: { format, date: "$joinedAt" } } } },
            { $group: { _id: "$day", count: { $sum: 1 } } },
            sortByDay,
         ]),
      ])

      const revenueAgg = await Participation.aggregate([
         matchJoinedAt,
         {
            $lookup: {
               from: "competitions",
               localField: "competitionId",
               foreignField: "_id",
               as: "competition",
            },
         },
         { $unwind: "$competition" },
         {
            $project: {
               day: { $dateToString: { format, date: "$joinedAt" } },
               amount: { $ifNull: ["$competition.entryFee", 0] },
            },
         },
         { $group: { _id: "$day", total: { $sum: "$amount" } } },
         sortByDay,
      ])

      const toSeries = (arr: any[], key: "count" | "total") =>
         arr.map((d) => ({ day: d._id as string, value: d[key] as number }))

      ResponseHelper.success(
         res,
         {
            users: toSeries(usersAgg, "count"),
            competitions: toSeries(competitionsAgg, "count"),
            participations: toSeries(participationsAgg, "count"),
            revenue: toSeries(revenueAgg, "total"),
         },
         200
      )
   } catch (error) {
      next(error)
   }
}

export const getAllTransactionsAdmin = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const page = req.query.page ? parseInt(String(req.query.page)) : 1
      const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10
      const userId = req.query.userId ? String(req.query.userId) : undefined
      const type = req.query.type === "DEBIT" || req.query.type === "CREDIT" ? String(req.query.type) : undefined

      const query: any = {}
      if (userId) query.userId = userId
      if (type) query.type = type

      const skip = (Math.max(1, page) - 1) * Math.max(1, limit)
      const [rows, total] = await Promise.all([
         Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Math.max(1, limit)).populate("userId", "name email").lean(),
         Transaction.countDocuments(query),
      ])

      ResponseHelper.success(res, { transactions: rows }, 200, { page: Math.max(1, page), limit: Math.max(1, limit), total })
   } catch (error) {
      next(error)
   }
}
