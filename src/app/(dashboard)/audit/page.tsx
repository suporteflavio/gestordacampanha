'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  ip: string | null
  createdAt: string
  user: { name: string; cpf: string } | null
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchLogs() }, [page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const response = await fetch(`/api/audit?page=${page}&limit=30`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar logs')
    } finally {
      setLoading(false)
    }
  }

  const actionColors: Record<string, string> = {
    CREATE: 'text-green-400',
    UPDATE: 'text-blue-400',
    DELETE: 'text-red-400',
    LOGIN: 'text-yellow-400',
    LOGOUT: 'text-gray-400',
  }

  return (
    <div>
      <PageHeader title="Auditoria" description="Histórico completo de ações no sistema" />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Carregando logs..." /></div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-8 h-8" />}
          title="Sem registros de auditoria"
          description="As ações realizadas no sistema aparecerão aqui."
        />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Data/Hora</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Usuário</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Ação</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Entidade</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                        {formatDate(log.createdAt, 'dd/MM/yy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {log.user ? log.user.name : <span className="text-gray-500">Sistema</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium font-mono ${actionColors[log.action] || 'text-gray-300'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {log.entity}
                        {log.entityId && (
                          <span className="text-gray-600 text-xs ml-1 font-mono">#{log.entityId.slice(0, 8)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono hidden lg:table-cell">{log.ip ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition">
                Anterior
              </button>
              <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition">
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
