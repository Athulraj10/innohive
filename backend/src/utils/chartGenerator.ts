import mongoose from "mongoose"
import { Candle, ICandle } from "../models/candle.model"

export interface GenerateCandlesOptions {
   competitionId: string
   count: number
   startTime?: number
   interval?: number
   basePrice?: number
   volatility?: number
   seed?: number
}

export const generateCandles = async (
   options: GenerateCandlesOptions
): Promise<ICandle[]> => {
   const {
      competitionId,
      count,
      startTime,
      interval = 86400,
      basePrice = 100,
      volatility = 0.02,
      seed,
   } = options

   let randomValue = seed || Math.random() * 1000
   const random = () => {
      randomValue = (randomValue * 9301 + 49297) % 233280
      return randomValue / 233280
   }

   const start = startTime || Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60

   const candles: ICandle[] = []
   let currentPrice = basePrice

   for (let i = 0; i < count; i++) {
      const time = start + i * interval

      const change = (random() - 0.5) * 2 * volatility
      const open = currentPrice
      const close = open * (1 + change)

      const highChange = random() * volatility * 0.5
      const lowChange = random() * volatility * 0.5
      const high = Math.max(open, close) * (1 + highChange)
      const low = Math.min(open, close) * (1 - lowChange)

      const maxPrice = Math.max(open, close)
      const minPrice = Math.min(open, close)
      const finalHigh = Math.max(high, maxPrice)
      const finalLow = Math.min(low, minPrice)

      const volume = Math.floor(1000 + random() * 99000)

      const candle = new Candle({
         competitionId: new mongoose.Types.ObjectId(competitionId),
         time,
         open,
         high: finalHigh,
         low: finalLow,
         close,
         volume,
      })

      candles.push(candle)
      currentPrice = close
   }

   return candles
}

export const saveCandles = async (candles: ICandle[]): Promise<void> => {
   if (candles.length === 0) return
   try {
      await Candle.insertMany(candles, { ordered: false })
   } catch (error: any) {
      if (error.code !== 11000) {
         throw error
      }
   }
}

export const generateAndSaveCandles = async (
   options: GenerateCandlesOptions
): Promise<ICandle[]> => {
   const candles = await generateCandles(options)
   await saveCandles(candles)
   return candles
}
