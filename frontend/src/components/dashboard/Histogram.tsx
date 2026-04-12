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
          <XAxis dataKey="source" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="INFO" stackId="a" fill={SEVERITY_COLORS.INFO} />
          <Bar dataKey="WARNING" stackId="a" fill={SEVERITY_COLORS.WARNING} />
          <Bar dataKey="ERROR" stackId="a" fill={SEVERITY_COLORS.ERROR} />
          <Bar dataKey="CRITICAL" stackId="a" fill={SEVERITY_COLORS.CRITICAL} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
