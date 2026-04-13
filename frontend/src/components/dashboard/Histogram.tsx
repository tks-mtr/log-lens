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
import type { HistogramEntry } from '@/types/log'

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

function renderTwoRowLegend({ payload }: { payload?: readonly { value?: string; color?: string }[] }) {
  if (!payload) return null
  const row1 = payload.filter((p) => p.value === 'CRITICAL' || p.value === 'ERROR')
  const row2 = payload.filter((p) => p.value === 'INFO' || p.value === 'WARNING')
  return (
    <div className="flex flex-col items-center gap-0.5 text-xs mt-1">
      <div className="flex gap-4">
        {row1.map((entry) => (
          <span key={entry.value} className="flex items-center gap-1">
            <span style={{ backgroundColor: entry.color }} className="inline-block w-3 h-2" />
            {entry.value}
          </span>
        ))}
      </div>
      <div className="flex gap-4">
        {row2.map((entry) => (
          <span key={entry.value} className="flex items-center gap-1">
            <span style={{ backgroundColor: entry.color }} className="inline-block w-3 h-2" />
            {entry.value}
          </span>
        ))}
      </div>
    </div>
  )
}

interface HistogramProps {
  data: HistogramEntry[]
}

const SEVERITY_COLORS = {
  INFO: '#3b82f6',
  WARNING: '#eab308',
  ERROR: '#f97316',
  CRITICAL: '#ef4444',
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
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--card-foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--card-foreground))' }}
            itemStyle={{ color: 'hsl(var(--card-foreground))' }}
          />
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
