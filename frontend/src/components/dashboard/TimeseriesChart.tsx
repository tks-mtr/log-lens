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
import { CustomTooltip, createTwoRowLegend } from '@/components/dashboard/chartUtils'
import { SEVERITY_COLORS } from '@/constants/severity'
import type { TimeseriesEntry } from '@/types/log'

const renderTwoRowLegend = createTwoRowLegend('h-0.5')

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
            <Tooltip content={<CustomTooltip />} />
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
