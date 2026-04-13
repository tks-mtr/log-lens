'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CustomTooltip, createTwoRowLegend } from '@/components/dashboard/chartUtils'
import { SEVERITY_COLORS } from '@/constants/severity'
import type { HistogramEntry } from '@/types/log'

const renderTwoRowLegend = createTwoRowLegend('h-2')

interface StaggeredTickProps {
  x?: number
  y?: number
  payload?: { value: string }
  index?: number
}

function StaggeredTick({ x = 0, y = 0, payload, index = 0 }: StaggeredTickProps) {
  const yOffset = index % 2 === 0 ? 0 : 14
  return (
    <text x={x} y={y + yOffset} textAnchor="middle" fontSize={11} fill="currentColor">
      {payload?.value}
    </text>
  )
}

interface HistogramProps {
  data: HistogramEntry[]
}

export function Histogram({ data }: HistogramProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-muted-foreground text-sm"
        data-testid="histogram-no-data"
      >
        No data
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="histogram">
      <h3 className="text-sm font-semibold">Severity Distribution by Source</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" tick={<StaggeredTick />} interval={0} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderTwoRowLegend} />
          <Bar dataKey="INFO" stackId="a" fill={SEVERITY_COLORS.INFO} />
          <Bar dataKey="WARNING" stackId="a" fill={SEVERITY_COLORS.WARNING} />
          <Bar dataKey="ERROR" stackId="a" fill={SEVERITY_COLORS.ERROR} />
          <Bar dataKey="CRITICAL" stackId="a" fill={SEVERITY_COLORS.CRITICAL} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
