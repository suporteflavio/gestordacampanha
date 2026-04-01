'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Bell, Building2 } from 'lucide-react'
import { formatCpf } from '@/lib/auth'

interface HeaderProps {
  userName: string
  tenantName: string
  role: string
  isRoot: boolean
}

export default function Header({ userName, tenantName, role, isRoot }: HeaderProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logout realizado')
      router.push('/login')
    } catch {
      toast.error('Erro ao fazer logout')
      setLoggingOut(false)
    }
  }

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-blue-400" />
        <span className="text-white font-medium text-sm truncate max-w-48">{tenantName}</span>
        {isRoot && (
          <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
            ROOT
          </span>
        )}
        {!isRoot && role === 'admin' && (
          <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
            ADMIN
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm hidden sm:block">
            {formatCpf(userName)}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
