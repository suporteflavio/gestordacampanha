import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  loading?: boolean
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  loading = false,
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-700 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-32" />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        {icon && (
          <div className={cn('p-2 rounded-lg border', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs mt-2',
            trend.value >= 0 ? 'text-green-400' : 'text-red-400',
          )}
        >
          <span>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
