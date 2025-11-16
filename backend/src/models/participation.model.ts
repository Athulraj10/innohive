import mongoose, { Schema, Document } from "mongoose"

export interface IParticipation extends Document {
   _id: mongoose.Types.ObjectId
   userId: mongoose.Types.ObjectId
   competitionId: mongoose.Types.ObjectId
   joinedAt: Date
}

const participationSchema = new Schema<IParticipation>({
   userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
   },
   competitionId: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      required: [true, "Competition ID is required"],
   },
   joinedAt: {
      type: Date,
      default: Date.now,
   },
})

participationSchema.index({ userId: 1, competitionId: 1 }, { unique: true })

participationSchema.index({ competitionId: 1 })

export const Participation = mongoose.model<IParticipation>(
   "Participation",
   participationSchema
)
