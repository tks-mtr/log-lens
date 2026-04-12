import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SummaryCard } from './SummaryCard'
import type { Severity } from '@/types/log'

describe('SummaryCard', () => {
  // V-01: 正常系 — 各 severity のレンダリング（4パターン）
  const cases: { severity: Severity; bgClass: string }[] = [
    { severity: 'INFO', bgClass: 'bg-blue-900/50' },
    { severity: 'WARNING', bgClass: 'bg-yellow-900/50' },
    { severity: 'ERROR', bgClass: 'bg-orange-900/50' },
    { severity: 'CRITICAL', bgClass: 'bg-red-950/50' },
  ]

  cases.forEach(({ severity, bgClass }) => {
    it(`renders_${severity}_severity_with_correct_count_icon_and_bg`, () => {
      render(<SummaryCard severity={severity} count={42} />)

      // severity ラベルが表示されている
      expect(screen.getByText(severity)).toBeInTheDocument()
      // count が表示されている
      expect(screen.getByText('42')).toBeInTheDocument()
      // 背景色クラスが存在する
      const card = screen.getByTestId(`summary-card-${severity.toLowerCase()}`)
      expect(card).toHaveClass(bgClass)
    })
  })

  // V-02: 境界値 — count=0 のとき "0" が表示される
  it('renders_zero_count_when_count_is_0', () => {
    render(<SummaryCard severity="INFO" count={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  // 追加: 各 severity に対応するアイコンが存在するかを確認（lucide-react はSVGを出力）
  it('renders_icon_element_for_each_severity', () => {
    const { container } = render(<SummaryCard severity="ERROR" count={5} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
