import { SEVERITY_ORDER } from '@/constants/severity'

export function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: readonly { name?: string; value?: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const sorted = [...payload].sort(
    (a, b) =>
      (SEVERITY_ORDER as readonly string[]).indexOf(a.name ?? '') -
      (SEVERITY_ORDER as readonly string[]).indexOf(b.name ?? ''),
  )
  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--card-foreground))',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
      }}
    >
      {label && (
        <p style={{ marginBottom: '4px', color: 'hsl(var(--card-foreground))' }}>{label}</p>
      )}
      {sorted.map((entry) => (
        <p
          key={entry.name}
          style={{
            color: 'hsl(var(--card-foreground))',
            margin: '2px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              backgroundColor: entry.color,
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

/**
 * Recharts Legend の content prop 用レンダラーを生成する。
 * @param swatchClassName 凡例カラースウォッチの高さ class（例: 'h-0.5' for line, 'h-2' for bar）
 */
export function createTwoRowLegend(swatchClassName: string) {
  return function TwoRowLegend({
    payload,
  }: {
    payload?: readonly { value?: string; color?: string }[]
  }) {
    if (!payload) return null
    const row1 = payload.filter((p) => p.value === 'INFO' || p.value === 'WARNING')
    const row2 = payload.filter((p) => p.value === 'ERROR' || p.value === 'CRITICAL')
    return (
      <div className="flex flex-col items-center gap-0.5 text-xs mt-1">
        <div className="flex gap-4">
          {row1.map((entry) => (
            <span key={entry.value} className="flex items-center gap-1">
              <span
                style={{ backgroundColor: entry.color }}
                className={`inline-block w-3 ${swatchClassName}`}
              />
              {entry.value}
            </span>
          ))}
        </div>
        <div className="flex gap-4">
          {row2.map((entry) => (
            <span key={entry.value} className="flex items-center gap-1">
              <span
                style={{ backgroundColor: entry.color }}
                className={`inline-block w-3 ${swatchClassName}`}
              />
              {entry.value}
            </span>
          ))}
        </div>
      </div>
    )
  }
}
