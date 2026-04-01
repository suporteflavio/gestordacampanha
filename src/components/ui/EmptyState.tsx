import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
