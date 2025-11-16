import { LineChart } from '@mui/x-charts/LineChart'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'

type Point = { day: string; value: number }

interface Props {
  data: Point[]
  height?: number
  color?: string
  area?: boolean
  title?: string
}

export const MuiLineChart = ({ data, height = 220, color = '#60a5fa', area = true }: Props) => {
  const x = data.map((d) => d.day)
  const y = data.map((d) => d.value)
  const formatNumber = (v: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v as number)

  return (
    <Box sx={{ width: '100%' }}>
      <LineChart
        height={height}
        series={[
          {
            id: 'series-1',
            data: y,
            curve: 'linear',
            color,
            area,
          },
        ]}
        xAxis={[{ scaleType: 'point', data: x, tickLabelStyle: { fill: '#9ca3af' } }]}
        yAxis={[{ valueFormatter: (v: number) => formatNumber(v), tickLabelStyle: { fill: '#9ca3af' } }]}
        margin={{ left: 64, right: 16, top: 8, bottom: 36 }}
        sx={{
          '& .MuiChartsAxis-tickLabel': { fill: '#9ca3af' },
          '& .MuiChartsAxis-line': { stroke: alpha('#9ca3af', 0.3) },
          '& .MuiChartsAxis-tick': { stroke: alpha('#9ca3af', 0.3) },
          '& .MuiChartsGrid-line': { stroke: alpha('#9ca3af', 0.12) },
          '& .MuiMarkElement-root': { stroke: '#fff', strokeWidth: 1, fill: color },
        }}
      />
    </Box>
  )
}


