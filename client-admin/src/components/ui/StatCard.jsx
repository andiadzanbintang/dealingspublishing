// src/components/ui/StatCard.jsx
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  color = 'primary',
}) {
  const colorStyles = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  }

  const safeTrend = trend ? String(trend) : ''
  const hasTrend = safeTrend.trim() !== ''
  const isNeutral =
    safeTrend === '0%' ||
    safeTrend === '+0%' ||
    safeTrend === '-0%' ||
    safeTrend === '—' ||
    safeTrend.toLowerCase() === 'n/a'

  const isNegative = safeTrend.startsWith('-') && !isNeutral
  const isPositive = hasTrend && !isNegative && !isNeutral

  const TrendIcon = isNeutral ? Minus : isNegative ? TrendingDown : TrendingUp

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500 font-medium">{title}</p>

          <p className="mt-2 text-3xl font-bold text-neutral-900 break-words">
            {value ?? '—'}
          </p>

          {hasTrend && (
            <div className="mt-2 flex items-center gap-1">
              <TrendIcon
                className={cn(
                  'w-3.5 h-3.5',
                  isPositive && 'text-success-500',
                  isNegative && 'text-danger-500',
                  isNeutral && 'text-neutral-400'
                )}
              />

              <span
                className={cn(
                  'text-xs font-medium',
                  isPositive && 'text-success-600',
                  isNegative && 'text-danger-600',
                  isNeutral && 'text-neutral-400'
                )}
              >
                {safeTrend}
              </span>

              {!isNeutral && (
                <span className="text-xs text-neutral-400">
                  vs last month
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
              colorStyles[color] || colorStyles.primary
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}