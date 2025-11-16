import mongoose, { Schema, Document } from "mongoose"

export interface ICandle extends Document {
   _id: mongoose.Types.ObjectId
   competitionId: mongoose.Types.ObjectId
   time: number
   open: number
   high: number
   low: number
   close: number
   volume: number
   createdAt?: Date
}

const candleSchema = new Schema<ICandle>(
   {
      competitionId: {
         type: Schema.Types.ObjectId,
         ref: "Competition",
         required: [true, "Competition ID is required"],
         index: true,
      },
      time: {
         type: Number,
         required: [true, "Time (Unix timestamp) is required"],
         index: true,
      },
      open: {
         type: Number,
         required: [true, "Open price is required"],
         min: [0, "Open price must be non-negative"],
      },
      high: {
         type: Number,
         required: [true, "High price is required"],
         min: [0, "High price must be non-negative"],
      },
      low: {
         type: Number,
         required: [true, "Low price is required"],
         min: [0, "Low price must be non-negative"],
      },
      close: {
         type: Number,
         required: [true, "Close price is required"],
         min: [0, "Close price must be non-negative"],
      },
      volume: {
         type: Number,
         required: [true, "Volume is required"],
         min: [0, "Volume must be non-negative"],
      },
      createdAt: {
         type: Date,
         default: Date.now,
      },
   },
   {
      timestamps: false,
   }
)

candleSchema.index({ competitionId: 1, time: 1 }, { unique: true })

candleSchema.index({ competitionId: 1 })

candleSchema.index({ time: 1 })

candleSchema.pre("save", function (next) {
   if (this.high < this.low) {
      return next(new Error("High price must be >= low price"))
   }
   if (this.high < this.open || this.high < this.close) {
      return next(new Error("High price must be >= open and close prices"))
   }
   if (this.low > this.open || this.low > this.close) {
      return next(new Error("Low price must be <= open and close prices"))
   }
   next()
})

export const Candle = mongoose.model<ICandle>("Candle", candleSchema)
