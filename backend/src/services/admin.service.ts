import mongoose from "mongoose"
import { User } from "../models/user.model"
import { Participation } from "../models/participation.model"
import { NotFoundError } from "../utils/errors"

export interface UserResponse {
   _id: string
   name: string
   email: string
   role: string
   createdAt: Date
}

export interface UserParticipationInfo {
   _id: string
   competitionId: string
   competitionName: string
   joinedAt: Date
   entryFee: number
   prizePool: number
}

export interface UserDetailsResponse extends UserResponse {
   participations: UserParticipationInfo[]
   totalParticipations: number
}

export const getAllUsers = async (options?: {
   page?: number
   limit?: number
   search?: string
   role?: "USER" | "ADMIN"
}): Promise<{
   users: UserResponse[]
   meta: { page: number; limit: number; total: number }
}> => {
   const page = Math.max(1, options?.page ?? 1)
   const limit = Math.max(1, Math.min(100, options?.limit ?? 10))
   const skip = (page - 1) * limit

   const query: any = {}
   if (options?.search) {
      const term = options.search.trim()
      query.$or = [
         { name: { $regex: term, $options: "i" } },
         { email: { $regex: term, $options: "i" } },
      ]
   }
   if (options?.role) {
      query.role = options.role
   }

   const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
   ])

   return {
      users: users.map((user) => ({
         _id: user._id.toString(),
         name: user.name,
         email: user.email,
         role: user.role || "USER",
         createdAt: user.createdAt,
      })),
      meta: { page, limit, total },
   }
}

export const getUserDetails = async (userId: string): Promise<UserDetailsResponse> => {
   if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundError("Invalid user ID", "INVALID_ID")
   }

   const user = await User.findById(userId).lean()
   if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND")
   }

   const participations = await Participation.find({
      userId: new mongoose.Types.ObjectId(userId),
   })
      .populate({
         path: "competitionId",
         select: "name entryFee prizePool",
      })
      .sort({ joinedAt: -1 })
      .lean()

   const participationInfo: UserParticipationInfo[] = participations.map((p: any) => ({
      _id: p._id.toString(),
      competitionId: p.competitionId?._id?.toString() || "",
      competitionName: p.competitionId?.name || "Unknown Competition",
      joinedAt: p.joinedAt,
      entryFee: p.competitionId?.entryFee || 0,
      prizePool: p.competitionId?.prizePool || 0,
   }))

   return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || "USER",
      createdAt: user.createdAt,
      participations: participationInfo,
      totalParticipations: participationInfo.length,
   }
}

