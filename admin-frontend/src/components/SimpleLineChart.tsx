import { useMemo } from "react"

interface Point {
  day: string
  value: number
}

interface Props {
  data: Point[]
  height?: number
  color?: string
  gradientFrom?: string
  gradientTo?: string
}

export const SimpleLineChart = ({
  data,
  height = 140,
  color = "#60a5fa",
  gradientFrom = "rgba(96,165,250,0.25)",
  gradientTo = "rgba(96,165,250,0.02)",
}: Props) => {
  const { path, areaPath, min, max } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", areaPath: "", min: 0, max: 1 }
    }
    const values = data.map((d) => d.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const pad = (maxVal - minVal) * 0.1 || 1
    const lo = minVal - pad
    const hi = maxVal + pad

    const w = 400
    const h = height

    const scaleX = (i: number) => (i / (data.length - 1)) * (w - 16) + 8
    const scaleY = (v: number) => {
      const t = (v - lo) / (hi - lo)
      return h - 8 - t * (h - 24)
    }

    let d = ""
    data.forEach((pt, i) => {
      const x = scaleX(i)
      const y = scaleY(pt.value)
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
    })

    const firstX = scaleX(0)
    const lastX = scaleX(data.length - 1)
    const baseY = scaleY(lo)
    const area = `${d} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`

    return { path: d, areaPath: area, min: minVal, max: maxVal }
  }, [data, height])

  return (
    <svg viewBox="0 0 400 160" height={height} className="w-full">
      <defs>
        <linearGradient id="fillGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={gradientFrom} />
          <stop offset="100%" stopColor={gradientTo} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="160" fill="transparent" />
      {areaPath && (
        <path d={areaPath} fill="url(#fillGradient)" stroke="none" />
      )}
      {path && (
        <path d={path} fill="none" stroke={color} strokeWidth="2" />
      )}
      <text x="8" y="16" fill="#9ca3af" fontSize="10">
        {`min: ${min.toFixed(0)}`}
      </text>
      <text x="320" y="16" fill="#9ca3af" fontSize="10" textAnchor="end">
        {`max: ${max.toFixed(0)}`}
      </text>
    </svg>
  )
}


