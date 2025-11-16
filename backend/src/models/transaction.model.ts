import mongoose, { Schema, Document } from "mongoose"

export type TransactionType = "DEBIT" | "CREDIT"

export interface ITransaction extends Document {
   _id: mongoose.Types.ObjectId
   userId: mongoose.Types.ObjectId
   type: TransactionType
   amount: number
   balanceBefore?: number
   balanceAfter?: number
   competitionId?: mongoose.Types.ObjectId
   description?: string
   createdAt: Date
}

const transactionSchema = new Schema<ITransaction>(
   {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
      type: { type: String, enum: ["DEBIT", "CREDIT"], required: true },
      amount: { type: Number, required: true, min: [0, "Amount must be non-negative"] },
      balanceBefore: { type: Number },
      balanceAfter: { type: Number },
      competitionId: { type: Schema.Types.ObjectId, ref: "Competition" },
      description: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
   },
   { timestamps: false }
)

transactionSchema.index({ userId: 1, createdAt: -1 })

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema)

