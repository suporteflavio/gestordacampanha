'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, DollarSign, Fuel, MoreHorizontal } from 'lucide-react'

interface MobileNavProps {
  role: string
  isRoot: boolean
}

export default function MobileNav({ role: _role, isRoot: _isRoot }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: '/leaders', label: 'Lideranças', icon: <Users className="w-5 h-5" /> },
    { href: '/finance', label: 'Financeiro', icon: <DollarSign className="w-5 h-5" /> },
    { href: '/fuel-vouchers', label: 'Combustível', icon: <Fuel className="w-5 h-5" /> },
    { href: '/settings', label: 'Mais', icon: <MoreHorizontal className="w-5 h-5" /> },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 lg:hidden z-40 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all min-w-0',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            {item.icon}
            <span className="text-xs truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
