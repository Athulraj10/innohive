import mongoose, { Schema, Document } from "mongoose"

export type UserRole = "USER" | "ADMIN"

export interface IUser extends Document {
   _id: mongoose.Types.ObjectId
   name: string
   email: string
   passwordHash: string
   passwordText: string
   role: UserRole
   walletBalance: number
   exposure: number
   createdAt: Date
}

const userSchema = new Schema<IUser>({
   name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
   },
   email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
   },
   passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
   },
   passwordText: {
      type: String,
      select: false,
   },
   role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
      required: true,
   },
   walletBalance: {
      type: Number,
      default: 100,
      min: 0,
   },
   exposure: {
      type: Number,
      default: 0,
      min: 0,
   },
   createdAt: {
      type: Date,
      default: Date.now,
   },
})

userSchema.index({ email: 1 }, { unique: true })

export const User = mongoose.model<IUser>("User", userSchema)
