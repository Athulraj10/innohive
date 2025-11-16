import mongoose, { Schema, Document } from "mongoose"

export interface ICompetition extends Document {
   _id: mongoose.Types.ObjectId
   name: string
   slug: string
   description?: string
   entryFee: number
   prizePool: number
   maxParticipants?: number
   createdAt: Date
   startsAt?: Date
   endsAt?: Date
   createdBy?: mongoose.Types.ObjectId
   resultsDeclaredAt?: Date
   winners?: Array<{
      userId: mongoose.Types.ObjectId
      rank: number
      portfolioValue?: number
      profitLoss?: number
   }>
}

const competitionSchema = new Schema<ICompetition>({
   name: {
      type: String,
      required: [true, "Competition name is required"],
      trim: true,
   },
   slug: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
   },
   description: {
      type: String,
      trim: true,
   },
   entryFee: {
      type: Number,
      required: [true, "Entry fee is required"],
      min: [0, "Entry fee must be non-negative"],
   },
   prizePool: {
      type: Number,
      required: [true, "Prize pool is required"],
      min: [0, "Prize pool must be non-negative"],
   },
   maxParticipants: {
      type: Number,
      min: [1, "Max participants must be at least 1"],
   },
   createdAt: {
      type: Date,
      default: Date.now,
   },
   startsAt: {
      type: Date,
   },
   endsAt: {
      type: Date,
   },
   createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
   },
   resultsDeclaredAt: {
      type: Date,
   },
   winners: [
      {
         userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
         rank: { type: Number, required: true },
         portfolioValue: { type: Number },
         profitLoss: { type: Number },
      },
   ],
})

competitionSchema.pre("save", function (next) {
   if (!this.slug || this.isModified("name") || this.isNew) {
      this.slug = this.name
         .toLowerCase()
         .trim()
         .replace(/[^\w\s-]/g, "")
         .replace(/\s+/g, "-")
         .replace(/-+/g, "-")
         .replace(/^-+|-+$/g, "")
   }
   next()
})

competitionSchema.index({ slug: 1 }, { unique: true })

export const Competition = mongoose.model<ICompetition>("Competition", competitionSchema)
