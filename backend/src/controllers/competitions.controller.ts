import { Request, Response, NextFunction } from "express"
import { body, validationResult } from "express-validator"
import {
   getCompetitions,
   getCompetitionById,
   createCompetition,
   joinCompetition,
   getChartData,
   getCompetitionParticipants,
} from "../services/competition.service"
import { AuthRequest } from "../middlewares/auth.middleware"
import { ResponseHelper } from "../utils/response"
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

export const listCompetitions = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10))
      const search = req.query.search as string
      const sort = req.query.sort as string
      const joined =
         req.query.joined === "true"
            ? true
            : req.query.joined === "false"
            ? false
            : undefined

      const userId = (req as AuthRequest).user?.id

      console.log("userId----------------", userId)
      console.log("joined----------------", joined)

      if (joined !== undefined && !userId) {
         ResponseHelper.error(res, "Authentication required for joined filter", 401, "UNAUTHORIZED")
         return
      }

      const result = await getCompetitions({
         page,
         limit,
         search,
         sort,
         joined,
         userId,
      })

      console.log("result----------------", result)

      ResponseHelper.paginated(
         res,
         result.data,
         result.meta.page,
         result.meta.limit,
         result.meta.total
      )
   } catch (error) {
      next(error)
   }
}

export const getCompetition = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params
      const userId = (req as AuthRequest).user?.id
      const competition = await getCompetitionById(id, userId)

      ResponseHelper.success(res, competition, 200)
   } catch (error) {
      next(error)
   }
}

export const create = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
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
      })

      ResponseHelper.success(res, competition, 201)
   } catch (error) {
      next(error)
   }
}

export const join = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      if (!req.user) {
         ResponseHelper.error(res, "Unauthorized", 401, "UNAUTHORIZED")
         return
      }

      const { id } = req.params
      const userId = req.user.id

      const participationId = await joinCompetition(userId, id)

      ResponseHelper.success(
         res,
         {
            participationId,
            message: "Successfully joined competition",
         },
         200
      )
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

export const getChartDataController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params
      const { from, to, res: resolution } = req.query

      const options: {
         from?: number
         to?: number
         res?: string
      } = {}

      if (from) {
         options.from = parseInt(from as string)
         if (isNaN(options.from)) {
            ResponseHelper.error(res, "Invalid from timestamp", 400, "INVALID_PARAMETER")
            return
         }
      }

      if (to) {
         options.to = parseInt(to as string)
         if (isNaN(options.to)) {
            ResponseHelper.error(res, "Invalid to timestamp", 400, "INVALID_PARAMETER")
            return
         }
      }

      if (resolution) {
         options.res = resolution as string
      }

      const chartData = await getChartData(id, options)

      ResponseHelper.success(res, { candles: chartData }, 200)
   } catch (error) {
      next(error)
   }
}

export const getParticipantsController = async (
   req: Request,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const { id } = req.params
      const page = req.query.page ? parseInt(req.query.page as string) : undefined
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

      const options: {
         page?: number
         limit?: number
      } = {}

      if (page !== undefined) {
         options.page = Math.max(1, page)
      }

      if (limit !== undefined) {
         options.limit = Math.min(100, Math.max(1, limit))
      }

      const participants = await getCompetitionParticipants(id, options)

      ResponseHelper.success(res, participants, 200)
   } catch (error) {
      next(error)
   }
}

export { handleValidationErrors }
