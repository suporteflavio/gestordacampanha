'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  Target,
  DollarSign,
  Fuel,
  AlertCircle,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Megaphone,
  Brain,
  Trophy,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles?: string[]
  module?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/leaders', label: 'Lideranças', icon: <Users className="w-5 h-5" />, module: 'leaders' },
  { href: '/voters', label: 'Eleitores', icon: <UserCheck className="w-5 h-5" />, module: 'voters' },
  { href: '/meetings', label: 'Reuniões', icon: <CalendarDays className="w-5 h-5" />, module: 'meetings' },
  { href: '/vote-goals', label: 'Metas de Votos', icon: <Target className="w-5 h-5" />, module: 'vote_goals' },
  { href: '/finance', label: 'Financeiro', icon: <DollarSign className="w-5 h-5" />, module: 'finance' },
  { href: '/team', label: 'Equipe/Folha', icon: <UsersRound className="w-5 h-5" />, module: 'team' },
  { href: '/fuel-vouchers', label: 'Vale-Combustível', icon: <Fuel className="w-5 h-5" />, module: 'fuel_vouchers' },
  { href: '/demands', label: 'Demandas', icon: <AlertCircle className="w-5 h-5" />, module: 'demands' },
  { href: '/competitors', label: 'Concorrentes', icon: <Trophy className="w-5 h-5" />, module: 'competitors' },
  { href: '/marketing', label: 'Marketing', icon: <Megaphone className="w-5 h-5" />, module: 'marketing' },
  { href: '/analytics', label: 'Analytics/IA', icon: <Brain className="w-5 h-5" />, module: 'analytics' },
  { href: '/reports', label: 'Relatórios', icon: <BarChart3 className="w-5 h-5" />, module: 'reports' },
  {
    href: '/audit',
    label: 'Auditoria',
    icon: <Shield className="w-5 h-5" />,
    module: 'audit_logs',
    roles: ['admin', 'root'],
  },
  { href: '/documents', label: 'Documentos', icon: <FileText className="w-5 h-5" />, module: 'documents' },
  { href: '/settings', label: 'Configurações', icon: <Settings className="w-5 h-5" />, roles: ['admin', 'root'] },
]

interface SidebarProps {
  role: string
  isRoot: boolean
  permissions: Record<string, { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }>
}

export default function Sidebar({ role, isRoot, permissions }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function canAccess(item: NavItem): boolean {
    if (isRoot || role === 'admin') return true
    if (item.roles && !item.roles.includes(role)) return false
    if (item.module && permissions[item.module]?.canRead === false) return false
    return true
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 hidden lg:flex flex-col',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">CampanhaOS</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('text-gray-400 hover:text-white transition', collapsed && 'mx-auto mt-2')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.filter(canAccess).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-sm font-medium',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
