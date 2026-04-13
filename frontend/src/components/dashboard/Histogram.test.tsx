import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Histogram } from './Histogram'
import type { HistogramEntry } from '@/types/log'

// W-07: Recharts は JSDOM 環境でレンダリング失敗するためモック化
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

const SAMPLE_DATA: HistogramEntry[] = [
  { source: 'api-server', INFO: 80, WARNING: 20, ERROR: 15, CRITICAL: 2 },
  { source: 'worker', INFO: 40, WARNING: 25, ERROR: 15, CRITICAL: 3 },
]

describe('Histogram', () => {
  // V-06: 正常系 — データが渡されたとき BarChart が描画される
  it('renders_bar_chart_when_histogram_data_is_provided', () => {
    render(<Histogram data={SAMPLE_DATA} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('histogram')).toBeInTheDocument()
  })

  // V-07: 境界値 — histogram=[] のとき "No data" が表示されクラッシュしない
  it('shows_no_data_message_when_histogram_is_empty', () => {
    render(<Histogram data={[]} />)
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument()
  })

  it('does_not_crash_with_empty_data', () => {
    // クラッシュしないことを確認
    expect(() => render(<Histogram data={[]} />)).not.toThrow()
  })
})
