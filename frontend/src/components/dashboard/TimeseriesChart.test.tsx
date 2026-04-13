import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TimeseriesChart } from './TimeseriesChart'
import type { TimeseriesEntry } from '@/types/log'

// W-07: Recharts は JSDOM 環境でレンダリング失敗するためモック化
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

const SAMPLE_DATA: TimeseriesEntry[] = [
  { timestamp: '2026-04-01T00:00:00Z', INFO: 50, WARNING: 10, ERROR: 5, CRITICAL: 1 },
  { timestamp: '2026-04-02T00:00:00Z', INFO: 60, WARNING: 15, ERROR: 8, CRITICAL: 0 },
]

describe('TimeseriesChart', () => {
  // V-03: 正常系 — データが渡されたとき LineChart が描画される
  it('renders_line_chart_when_data_is_provided', () => {
    render(
      <TimeseriesChart
        data={SAMPLE_DATA}
        interval="day"
        onIntervalChange={vi.fn()}
      />
    )
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  // V-04: 正常系 — Hour/Day/Week タブ切替で onIntervalChange が呼ばれる
  it('calls_onIntervalChange_when_hour_tab_clicked', () => {
    const onIntervalChange = vi.fn()
    render(
      <TimeseriesChart
        data={SAMPLE_DATA}
        interval="day"
        onIntervalChange={onIntervalChange}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Hour' }))
    expect(onIntervalChange).toHaveBeenCalledWith('hour')
  })

  it('calls_onIntervalChange_when_week_tab_clicked', () => {
    const onIntervalChange = vi.fn()
    render(
      <TimeseriesChart
        data={SAMPLE_DATA}
        interval="day"
        onIntervalChange={onIntervalChange}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }))
    expect(onIntervalChange).toHaveBeenCalledWith('week')
  })

  it('renders_interval_tabs_with_correct_active_state', () => {
    render(
      <TimeseriesChart
        data={SAMPLE_DATA}
        interval="day"
        onIntervalChange={vi.fn()}
      />
    )
    const dayTab = screen.getByRole('tab', { name: 'Day' })
    expect(dayTab).toHaveAttribute('aria-selected', 'true')

    const hourTab = screen.getByRole('tab', { name: 'Hour' })
    expect(hourTab).toHaveAttribute('aria-selected', 'false')
  })

  // V-05: 境界値 — data=[] のとき "No data" が表示されクラッシュしない
  it('shows_no_data_message_when_data_is_empty', () => {
    render(
      <TimeseriesChart
        data={[]}
        interval="day"
        onIntervalChange={vi.fn()}
      />
    )
    expect(screen.getByText('No data')).toBeInTheDocument()
    // LineChart は表示されない
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
  })
})
