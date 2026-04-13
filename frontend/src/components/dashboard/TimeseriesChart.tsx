'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TimeseriesEntry } from '@/types/log'

function renderTwoRowLegend({ payload }: { payload?: readonly { value?: string; color?: string }[] }) {
  if (!payload) return null
  const row1 = payload.filter((p) => p.value === 'CRITICAL' || p.value === 'ERROR')
  const row2 = payload.filter((p) => p.value === 'INFO' || p.value === 'WARNING')
  return (
    <div className="flex flex-col items-center gap-0.5 text-xs mt-1">
      <div className="flex gap-4">
        {row1.map((entry) => (
          <span key={entry.value} className="flex items-center gap-1">
            <span style={{ backgroundColor: entry.color }} className="inline-block w-3 h-0.5" />
            {entry.value}
          </span>
        ))}
      </div>
      <div className="flex gap-4">
        {row2.map((entry) => (
          <span key={entry.value} className="flex items-center gap-1">
            <span style={{ backgroundColor: entry.color }} className="inline-block w-3 h-0.5" />
            {entry.value}
          </span>
        ))}
      </div>
    </div>
  )
}

interface TimeseriesChartProps {
  data: TimeseriesEntry[]
  interval: 'hour' | 'day' | 'week'
  onIntervalChange: (interval: 'hour' | 'day' | 'week') => void
}

const INTERVALS: { value: 'hour' | 'day' | 'week'; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
]

const SEVERITY_COLORS = {
  INFO: '#3b82f6',
  WARNING: '#eab308',
  ERROR: '#f97316',
  CRITICAL: '#ef4444',
}

export function TimeseriesChart({ data, interval, onIntervalChange }: TimeseriesChartProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="timeseries-chart">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Log Count Over Time</h3>
        <div className="flex gap-1" role="tablist" aria-label="Interval">
          {INTERVALS.map((item) => (
            <button
              key={item.value}
              role="tab"
              aria-selected={interval === item.value}
              onClick={() => onIntervalChange(item.value)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                interval === item.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} />
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
            <Line
              type="monotone"
              dataKey="INFO"
              stroke={SEVERITY_COLORS.INFO}
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="WARNING"
              stroke={SEVERITY_COLORS.WARNING}
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="ERROR"
              stroke={SEVERITY_COLORS.ERROR}
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="CRITICAL"
              stroke={SEVERITY_COLORS.CRITICAL}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
