'use client'

import { Info, AlertTriangle, AlertCircle, Target } from 'lucide-react'
import type { Severity } from '@/types/log'

interface SummaryCardProps {
  severity: Severity
  count: number
}

const SEVERITY_CONFIG: Record<
  Severity,
  { bg: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  INFO: {
    bg: 'bg-blue-900/50',
    icon: Info,
    label: 'INFO',
  },
  WARNING: {
    bg: 'bg-yellow-900/50',
    icon: AlertTriangle,
    label: 'WARNING',
  },
  ERROR: {
    bg: 'bg-orange-900/50',
    icon: AlertCircle,
    label: 'ERROR',
  },
  CRITICAL: {
    bg: 'bg-red-950/50',
    icon: Target,
    label: 'CRITICAL',
  },
}

export function SummaryCard({ severity, count }: SummaryCardProps) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <div
      className={`${config.bg} rounded-lg p-4 flex flex-col gap-2`}
      data-testid={`summary-card-${severity.toLowerCase()}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-4xl font-bold">{count}</span>
    </div>
  )
}
