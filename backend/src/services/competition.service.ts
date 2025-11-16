import mongoose from "mongoose"
import { Competition, ICompetition } from "../models/competition.model"
import { Participation } from "../models/participation.model"
import { Candle, ICandle } from "../models/candle.model"
import { User } from "../models/user.model"
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors"
import { Transaction } from "../models/transaction.model"

export interface CompetitionFilters {
   page?: number
   limit?: number
   search?: string
   sort?: string
   joined?: boolean
   userId?: string
}

export interface CompetitionWithStats {
   _id: mongoose.Types.ObjectId
   name: string
   description?: string
   entryFee: number
   prizePool: number
   maxParticipants?: number
   createdAt: Date
   startsAt?: Date
   endsAt?: Date
   participantCount: number
   joined: boolean
}

export interface CompetitionListResponse {
   data: CompetitionWithStats[]
   meta: {
      page: number
      limit: number
      total: number
   }
}

export const getCompetitions = async (
   filters: CompetitionFilters
): Promise<CompetitionListResponse> => {
   console.log("filters----------------", filters)
   const page = filters.page || 1
   const limit = filters.limit || 10
   const skip = (page - 1) * limit

   const query: any = {}

   if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" }
   }

    let joinedCompetitionIds: mongoose.Types.ObjectId[] = []
   if (filters.joined !== undefined && filters.userId) {
      const userIdObj = mongoose.Types.ObjectId.isValid(filters.userId)
         ? new mongoose.Types.ObjectId(filters.userId)
         : filters.userId
      const userParticipations = await Participation.find({
         userId: userIdObj,
      }).select("competitionId")
      joinedCompetitionIds = userParticipations.map((p) => p.competitionId)

      console.log("joinedCompetitionIds----------------", joinedCompetitionIds)
      console.log(
         "userParticipations count----------------",
         userParticipations?.length || 0
      )

      if (filters.joined === true) {
         if (joinedCompetitionIds.length === 0) {
            return {
               data: [],
               meta: {
                  page,
                  limit,
                  total: 0,
               },
            }
         }
         query._id = { $in: joinedCompetitionIds }
      }
      else if (filters.joined === false && joinedCompetitionIds.length > 0) {
         query._id = { $nin: joinedCompetitionIds }
      }
   }

   console.log("query----------------", query)

   const competitions = await Competition.find(query)
      .sort(getSortOption(filters.sort))
      .skip(skip)
      .limit(limit)
      .lean()
   console.log(
      "fetched competitionIds----------------",
      competitions.map((c) => c._id)
   )

   const competitionIds = competitions.map((c) => c._id)
   const participations = await Participation.find({
      competitionId: { $in: competitionIds },
   })

   const userParticipations = filters.userId
      ? await Participation.find({
           userId: mongoose.Types.ObjectId.isValid(filters.userId)
              ? new mongoose.Types.ObjectId(filters.userId)
              : filters.userId,
           competitionId: { $in: competitionIds },
        })
      : []

   const userParticipationSet = new Set(
      userParticipations.map((p) => p.competitionId.toString())
   )
   console.log(
      "userParticipationSet----------------",
      Array.from(userParticipationSet).slice(0, 10)
   )

   const participantCounts = new Map<string, number>()
   participations.forEach((p) => {
      const compId = p.competitionId.toString()
      participantCounts.set(compId, (participantCounts.get(compId) || 0) + 1)
   })

   const data: CompetitionWithStats[] = competitions.map((comp) => ({
      ...comp,
      participantCount: participantCounts.get(comp._id.toString()) || 0,
      joined: userParticipationSet.has(comp._id.toString()),
   }))

   const filteredData: CompetitionWithStats[] =
      filters.joined !== undefined && !!filters.userId
         ? data.filter((c) => c.joined === filters.joined)
         : data

   const total = await Competition.countDocuments(query)

   return {
      data: filteredData,
      meta: {
         page,
         limit,
         total,
      },
   }
}

export const getCompetitionById = async (
   id: string,
   userId?: string
): Promise<ICompetition & { joined?: boolean; participantCount?: number }> => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(id)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   const result: any = competition.toObject()

   const participantCount = await Participation.countDocuments({
      competitionId: competition._id,
   })
   result.participantCount = participantCount

   if (userId) {
      const participation = await Participation.findOne({
         userId: mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId,
         competitionId: competition._id,
      })
      result.joined = !!participation
   }

   return result
}

export const createCompetition = async (data: {
   name: string
   description?: string
   entryFee: number
   prizePool: number
   maxParticipants?: number
   startsAt?: Date
   endsAt?: Date
   createdBy?: string
}): Promise<ICompetition> => {
   const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")

   const competitionData: any = {
      name: data.name,
      slug: slug,
      description: data.description,
      entryFee: data.entryFee,
      prizePool: data.prizePool,
      maxParticipants: data.maxParticipants,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
   }

   if (data.createdBy) {
      competitionData.createdBy = data.createdBy
   }

   const competition = new Competition(competitionData)
   await competition.save()
   return competition
}

export const joinCompetition = async (
   userId: string,
   competitionId: string
): Promise<string> => {
   if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(competitionId)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   const existingParticipation = await Participation.findOne({
      userId: mongoose.Types.ObjectId.isValid(userId)
         ? new mongoose.Types.ObjectId(userId)
         : userId,
      competitionId: mongoose.Types.ObjectId.isValid(competitionId)
         ? new mongoose.Types.ObjectId(competitionId)
         : competitionId,
   })

   if (existingParticipation) {
      throw new ConflictError("Already joined", "ALREADY_JOINED")
   }

   if (competition.maxParticipants) {
      const currentCount = await Participation.countDocuments({ competitionId })
      if (currentCount >= competition.maxParticipants) {
         throw new BadRequestError("Competition is full", "COMPETITION_FULL")
      }
   }

   if (competition.endsAt && new Date() > competition.endsAt) {
      throw new BadRequestError("Competition has ended", "COMPETITION_ENDED")
   }

   if (competition.startsAt && new Date() < competition.startsAt) {
      throw new BadRequestError(
         "Competition has not started yet",
         "COMPETITION_NOT_STARTED"
      )
   }

   const user = await User.findById(userId)
   if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND")
   }
   const entryFee = competition.entryFee || 0
   const remainingBalance = (user.walletBalance ?? 0) - (user.exposure ?? 0)
   if (entryFee > remainingBalance) {
      throw new BadRequestError("Insufficient balance", "INSUFFICIENT_BALANCE")
   }

   try {
      const beforeAvailable = (user.walletBalance ?? 0) - (user.exposure ?? 0)

      const participation = new Participation({
         userId: mongoose.Types.ObjectId.isValid(userId)
            ? new mongoose.Types.ObjectId(userId)
            : userId,
         competitionId: mongoose.Types.ObjectId.isValid(competitionId)
            ? new mongoose.Types.ObjectId(competitionId)
            : competitionId,
      })
      await participation.save()

      user.exposure = (user.exposure ?? 0) + entryFee
      await user.save()

      await Transaction.create({
         userId: user._id,
         type: "DEBIT",
         amount: entryFee,
         balanceBefore: beforeAvailable,
         balanceAfter: beforeAvailable - entryFee,
         competitionId: participation.competitionId as any,
         description: `Joined competition and entry fee debited`,
      })

      return participation._id.toString()
   } catch (error: any) {
      if (error.code === 11000) {
         throw new ConflictError("Already joined", "ALREADY_JOINED")
      }
      throw error
   }
}

export const updateCompetition = async (
   id: string,
   data: {
      name?: string
      description?: string
      entryFee?: number
      prizePool?: number
      maxParticipants?: number
      startsAt?: Date
      endsAt?: Date
   }
): Promise<ICompetition> => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(id)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   if (data.name !== undefined) competition.name = data.name.trim()
   if (data.description !== undefined) {
      competition.description = data.description.trim() || undefined
   }
   if (data.entryFee !== undefined) competition.entryFee = data.entryFee
   if (data.prizePool !== undefined) competition.prizePool = data.prizePool
   if (data.maxParticipants !== undefined) {
      competition.maxParticipants = data.maxParticipants || undefined
   }
   if (data.startsAt !== undefined) {
      competition.startsAt = data.startsAt || undefined
   }
   if (data.endsAt !== undefined) {
      competition.endsAt = data.endsAt || undefined
   }

   await competition.save()
   return competition
}

export const deleteCompetition = async (id: string): Promise<void> => {
   if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(id)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   await Participation.deleteMany({ competitionId: id })

   await Competition.findByIdAndDelete(id)
}

export interface ParticipantInfo {
   _id: string
   userId: {
      _id: string
      name: string
      email: string
   }
   competitionId: string
   joinedAt: Date
   rank?: number
   portfolioValue?: number
   profitLoss?: number
}

export const getCompetitionParticipants = async (
   competitionId: string,
   options?: {
      page?: number
      limit?: number
   }
): Promise<ParticipantInfo[]> => {
   if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(competitionId)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   const candles = await Candle.find({ competitionId }).sort({ time: 1 }).lean()
   const firstCandle = candles[0]
   const lastCandle = candles[candles.length - 1]
   const defaultPrice = firstCandle?.open || 100
   const currentPriceGlobal = lastCandle?.close || defaultPrice

   const participations = await Participation.find({ competitionId })
      .populate({
         path: "userId",
         select: "name email",
      })
      .sort({ joinedAt: -1 })
      .lean()

   const participantsWithValues: ParticipantInfo[] = participations.map((p: any) => {
      const joinTsSec =
         p.joinedAt instanceof Date
            ? Math.floor(p.joinedAt.getTime() / 1000)
            : Math.floor(new Date(p.joinedAt).getTime() / 1000)

      let entryPrice = defaultPrice
      if (candles.length > 0) {
         let lo = 0
         let hi = candles.length - 1
         let idx = -1
         while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2)
            if (candles[mid].time <= joinTsSec) {
               idx = mid
               lo = mid + 1
            } else {
               hi = mid - 1
            }
         }
         if (idx >= 0) {
            entryPrice = candles[idx].close ?? candles[idx].open ?? defaultPrice
         } else {
            entryPrice = firstCandle?.open ?? defaultPrice
         }
      }

      const base = competition.entryFee || 0
      const priceChangeRatio =
         entryPrice > 0 ? currentPriceGlobal / entryPrice : 1
      const portfolioValue = base > 0 ? base * priceChangeRatio : 0
      const profitLoss = base > 0 ? ((portfolioValue - base) / base) * 100 : 0

      return {
         _id: p._id.toString(),
         userId: {
            _id: p.userId?._id?.toString() || "",
            name: p.userId?.name || "",
            email: p.userId?.email || "",
         },
         competitionId: p.competitionId.toString(),
         joinedAt: p.joinedAt,
         portfolioValue: Math.round(portfolioValue * 100) / 100, // Round to 2 decimals
         profitLoss: Math.round(profitLoss * 100) / 100, // Round to 2 decimals
      }
   })

   participantsWithValues.sort((a, b) => {
      const aValue = a.portfolioValue || 0
      const bValue = b.portfolioValue || 0
      return bValue - aValue
   })

   participantsWithValues.forEach((participant, index) => {
      participant.rank = index + 1
   })

   if (options?.page && options?.limit) {
      const page = Math.max(1, options.page)
      const limit = Math.max(1, options.limit)
      const start = (page - 1) * limit
      const end = start + limit
      return participantsWithValues.slice(start, end)
   }

   return participantsWithValues
}

export const declareCompetitionResults = async (
   competitionId: string,
   options?: { topN?: number }
): Promise<ICompetition> => {
   if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(competitionId)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   if (competition.endsAt && new Date() < competition.endsAt) {
      throw new BadRequestError("Competition has not ended yet", "COMPETITION_NOT_ENDED")
   }

   if (competition.resultsDeclaredAt) {
      throw new ConflictError("Results already declared", "RESULTS_ALREADY_DECLARED")
   }

   const participants = await getCompetitionParticipants(competitionId)
   if (participants.length === 0) {
      throw new BadRequestError("No participants to rank", "NO_PARTICIPANTS")
   }

   const topN = Math.max(1, options?.topN ?? 3)
   const winners = participants.slice(0, topN).map((p) => ({
      userId: new mongoose.Types.ObjectId(p.userId._id),
      rank: p.rank || 0,
      portfolioValue: p.portfolioValue,
      profitLoss: p.profitLoss,
   }))

   competition.winners = winners as any
   competition.resultsDeclaredAt = new Date()
   await competition.save()

   return competition
}

export interface ChartDataPoint {
   time: number
   open: number
   high: number
   low: number
   close: number
   volume: number
}

export const getChartData = async (
   competitionId: string,
   options?: {
      from?: number
      to?: number
      res?: string
   }
): Promise<ChartDataPoint[]> => {
   if (!mongoose.Types.ObjectId.isValid(competitionId)) {
      throw new BadRequestError("Invalid competition ID", "INVALID_ID")
   }

   const competition = await Competition.findById(competitionId)
   if (!competition) {
      throw new NotFoundError("Competition not found", "COMPETITION_NOT_FOUND")
   }

   const query: any = { competitionId }

   if (options?.from || options?.to) {
      query.time = {}
      if (options.from) {
         query.time.$gte = options.from
      }
      if (options.to) {
         query.time.$lte = options.to
      }
   }

   const candles = await Candle.find(query).sort({ time: 1 }).lean()

   return candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
   }))
}

const getSortOption = (sort?: string): any => {
   if (!sort) return { createdAt: -1 }

   const [field, order] = sort.split(":")
   const sortOrder = order === "asc" ? 1 : -1

   const validFields: Record<string, string> = {
      prize: "prizePool",
      fee: "entryFee",
      name: "name",
      created: "createdAt",
   }

   const sortField = validFields[field] || "createdAt"
   return { [sortField]: sortOrder }
}
