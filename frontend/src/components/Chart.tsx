import { useEffect, useRef, useState } from "react"
import {
   createChart,
   IChartApi,
   ISeriesApi,
   CandlestickData,
   Time,
   CandlestickSeries,
   LineSeries,
   LineData,
   LineStyle,
} from "lightweight-charts"
import { getChartData, ChartDataPoint } from "../api/competitions"
import { ApiError } from "../types/api"

interface ChartProps {
   competitionId: string
   height?: number
}

export const Chart = ({ competitionId, height = 400 }: ChartProps) => {
   const chartContainerRef = useRef<HTMLDivElement>(null)
   const chartRef = useRef<IChartApi | null>(null)
   const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
  const [resolution, setResolution] = useState<string>('1H')
  const [showSMA20, setShowSMA20] = useState<boolean>(true)
  const [showEMA50, setShowEMA50] = useState<boolean>(false)
  const latestCandlesRef = useRef<ChartDataPoint[] | null>(null)

   useEffect(() => {
      if (!chartContainerRef.current) return

      const chart = createChart(chartContainerRef.current, {
         width: chartContainerRef.current.clientWidth,
         height,
         layout: {
            background: { color: "#1a1a1a" },
            textColor: "#d1d5db",
            attributionLogo: true, 
          },
         grid: {
            vertLines: { color: "#2a2a2a", style: 0 },
            horzLines: { color: "#2a2a2a", style: 0 },
         },
         crosshair: {
            mode: 0,
            vertLine: {
               color: "#3a3a3a",
               width: 1,
               style: 1,
            },
            horzLine: {
               color: "#3a3a3a",
               width: 1,
               style: 1,
            },
         },
         rightPriceScale: {
            borderColor: "#2a2a2a",
            scaleMargins: {
               top: 0.1,
               bottom: 0.1,
            },
         },
         timeScale: {
            borderColor: "#2a2a2a",
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 12,
            barSpacing: 6,
         },
      })

      chartRef.current = chart

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
         upColor: "#26a69a", 
         downColor: "#ef5350",
         borderVisible: false,
         wickUpColor: "#26a69a",
         wickDownColor: "#ef5350",
         priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
         },
      })

      seriesRef.current = candlestickSeries
     smaSeriesRef.current = chart.addSeries(LineSeries, {
       color: '#eab308',
       lineWidth: 2,
       lineStyle: LineStyle.Solid,
       lastValueVisible: false,
       priceLineVisible: false,
     })
     emaSeriesRef.current = chart.addSeries(LineSeries, {
       color: '#60a5fa',
       lineWidth: 2,
       lineStyle: LineStyle.Dotted,
       lastValueVisible: false,
       priceLineVisible: false,
     })
     if (!showSMA20 && smaSeriesRef.current) smaSeriesRef.current.applyOptions({ visible: false })
     if (!showEMA50 && emaSeriesRef.current) emaSeriesRef.current.applyOptions({ visible: false })

      const fetchData = async () => {
         setIsLoading(true)
         setError(null)
         try {
            const response = await getChartData(competitionId, { res: resolution })
            
            if (!response.candles || response.candles.length === 0) {
               setError("No chart data available")
               setIsLoading(false)
               return
            }

           const formattedData: CandlestickData<Time>[] = response.candles.map(
               (candle: ChartDataPoint) => ({
                  time: candle.time as Time,
                 open: Number(candle.open),
                  high: Number(candle.high),
                  low: Number(candle.low),
                  close: Number(candle.close),
               })
            )

            candlestickSeries.setData(formattedData)
            chart.timeScale().fitContent()
            latestCandlesRef.current = response.candles
            computeAndRenderIndicators()
         } catch (err: any) {
            const apiError = err.response?.data as ApiError
            setError(apiError?.error || "Failed to load chart data")
            console.error("Error loading chart data:", err)
         } finally {
            setIsLoading(false)
         }
      }

      fetchData()

      const handleResize = () => {
         if (chartContainerRef.current && chartRef.current) {
            chartRef.current.applyOptions({
               width: chartContainerRef.current.clientWidth,
            })
         }
      }

      window.addEventListener("resize", handleResize)

      return () => {
         window.removeEventListener("resize", handleResize)
         if (chartRef.current) {
            chartRef.current.remove()
            chartRef.current = null
         }
      }
   }, [competitionId, height, resolution])

  useEffect(() => {
    if (smaSeriesRef.current) {
      smaSeriesRef.current.applyOptions({ visible: showSMA20 })
    }
  }, [showSMA20])

  useEffect(() => {
    if (emaSeriesRef.current) {
      emaSeriesRef.current.applyOptions({ visible: showEMA50 })
    }
  }, [showEMA50])

  const computeAndRenderIndicators = () => {
    const candles = latestCandlesRef.current
    if (!candles) return
    if (smaSeriesRef.current) {
      const period = 20
      const sma: LineData[] = []
      let sum = 0
      for (let i = 0; i < candles.length; i++) {
        const close = Number(candles[i].close)
        sum += close
        if (i >= period) {
          sum -= Number(candles[i - period].close)
        }
        if (i >= period - 1) {
          sma.push({ time: candles[i].time as Time, value: +(sum / period).toFixed(4) })
        }
      }
      smaSeriesRef.current.setData(sma)
    }
 
    if (emaSeriesRef.current) {
      const period = 50
      const k = 2 / (period + 1)
      const ema: LineData[] = []
      let prevEma: number | null = null
      for (let i = 0; i < candles.length; i++) {
        const close = Number(candles[i].close)
        if (prevEma == null) {
          prevEma = close
        } else {
          prevEma = close * k + prevEma * (1 - k)
        }
        if (i >= period - 1) {
          ema.push({ time: candles[i].time as Time, value: +(+prevEma).toFixed(4) })
        }
      }
      emaSeriesRef.current.setData(ema)
    }
  }

   if (error) {
      return (
         <div className='flex items-center justify-center h-96 bg-dark-card rounded-lg border border-dark-border'>
            <div className='text-center'>
               <p className='text-danger-light mb-2'>Failed to load chart</p>
               <p className='text-sm text-gray-500'>{error}</p>
            </div>
         </div>
      )
   }

  return (
    <div className='relative'>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg border border-dark-border bg-dark-surface p-1">
          {['1m','5m','15m','1H','4H','1D'].map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`px-2.5 py-1.5 rounded-md text-xs ${
                resolution === res ? 'bg-primary-600 text-white shadow-glow' : 'text-gray-300 hover:bg-dark-hover'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-2 ml-2">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showSMA20}
              onChange={(e) => setShowSMA20(e.target.checked)}
            />
            SMA 20
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showEMA50}
              onChange={(e) => setShowEMA50(e.target.checked)}
            />
            EMA 50
          </label>
        </div>
      </div>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-dark-card/80 rounded-lg z-10'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4'></div>
            <p className='text-gray-400'>Loading chart data...</p>
          </div>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className='w-full bg-dark-card rounded-lg border border-dark-border overflow-hidden'
        style={{ height: `${height}px` }}
      />
    </div>
  )
}
