'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, AlertCircle, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate, cn } from '@/lib/utils'

interface Demand {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  priority: string
  address: string | null
  notes: string | null
  createdAt: string
  municipality: { name: string } | null
  requester: { name: string } | null
}

const categoryLabels: Record<string, string> = {
  infrastructure: 'Infraestrutura',
  health: 'Saúde',
  education: 'Educação',
  security: 'Segurança',
  social: 'Assistência Social',
  environment: 'Meio Ambiente',
  other: 'Outros',
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgente', color: 'text-red-400 bg-red-400/10' },
  high: { label: 'Alta', color: 'text-orange-400 bg-orange-400/10' },
  medium: { label: 'Média', color: 'text-yellow-400 bg-yellow-400/10' },
  low: { label: 'Baixa', color: 'text-gray-400 bg-gray-400/10' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberta', color: 'text-blue-400' },
  in_progress: { label: 'Em Andamento', color: 'text-yellow-400' },
  resolved: { label: 'Resolvida', color: 'text-green-400' },
  closed: { label: 'Fechada', color: 'text-gray-400' },
}

interface DemandForm {
  title: string
  description: string
  category: string
  priority: string
  status: string
  address: string
  notes: string
}

const emptyForm: DemandForm = {
  title: '',
  description: '',
  category: 'other',
  priority: 'medium',
  status: 'open',
  address: '',
  notes: '',
}

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchDemands()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, categoryFilter, page])

  async function fetchDemands() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (priorityFilter) params.set('priority', priorityFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const response = await fetch(`/api/demands?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setDemands(data.demands)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar demandas')
    } finally {
      setLoading(false)
    }
  }

  async function deleteDemand(id: string) {
    if (!confirm('Excluir esta demanda?')) return
    try {
      const response = await fetch(`/api/demands/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      toast.success('Demanda excluída')
      fetchDemands()
    } catch {
      toast.error('Erro ao excluir demanda')
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch(`/api/demands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error()
      toast.success('Status atualizado')
      fetchDemands()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const open = demands.filter(d => d.status === 'open').length
  const inProgress = demands.filter(d => d.status === 'in_progress').length
  const resolved = demands.filter(d => d.status === 'resolved').length
  const urgent = demands.filter(d => d.priority === 'urgent').length

  function openCreate() { setEditingDemand(null); setShowModal(true) }
  function openEdit(d: Demand) { setEditingDemand(d); setShowModal(true) }

  return (
    <div>
      <PageHeader
        title="Demandas"
        description="Gestão de demandas e solicitações da comunidade"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Nova Demanda
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Abertas" value={open} icon={<AlertCircle className="w-4 h-4" />} color="blue" loading={loading} />
        <StatsCard title="Em Andamento" value={inProgress} color="yellow" loading={loading} />
        <StatsCard title="Resolvidas" value={resolved} color="green" loading={loading} />
        <StatsCard title="Urgentes" value={urgent} color="red" loading={loading} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="open">Abertas</option>
          <option value="in_progress">Em Andamento</option>
          <option value="resolved">Resolvidas</option>
          <option value="closed">Fechadas</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando demandas..." />
        </div>
      ) : demands.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-8 h-8" />}
          title="Nenhuma demanda encontrada"
          description="Registre demandas e solicitações da comunidade."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Nova Demanda
            </button>
          }
        />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Título</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Categoria</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Prioridade</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Município</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Criada em</th>
                    <th className="px-4 py-3 text-right text-gray-400 text-xs font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {demands.map(d => {
                    const pc = priorityConfig[d.priority] ?? { label: d.priority, color: 'text-gray-400 bg-gray-400/10' }
                    const sc = statusConfig[d.status] ?? { label: d.status, color: 'text-gray-400' }
                    return (
                      <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{d.title}</p>
                          {d.description && <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{d.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{categoryLabels[d.category] ?? d.category}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', pc.color)}>{pc.label}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{d.municipality?.name ?? '-'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={d.status}
                            onChange={e => updateStatus(d.id, e.target.value)}
                            className={cn('text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer', sc.color)}
                          >
                            <option value="open">Aberta</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="resolved">Resolvida</option>
                            <option value="closed">Fechada</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">{formatDate(d.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(d)} className="text-gray-400 hover:text-white transition">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteDemand(d.id)} className="text-red-400 hover:text-red-300 transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition"
              >
                Anterior
              </button>
              <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-700 transition"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <DemandModal
          demand={editingDemand}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchDemands() }}
        />
      )}
    </div>
  )
}

function DemandModal({
  demand,
  onClose,
  onSaved,
}: {
  demand: Demand | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<DemandForm>(
    demand
      ? {
          title: demand.title,
          description: demand.description ?? '',
          category: demand.category,
          priority: demand.priority,
          status: demand.status,
          address: demand.address ?? '',
          notes: demand.notes ?? '',
        }
      : emptyForm
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category) { toast.error('Título e categoria são obrigatórios'); return }
    setLoading(true)
    try {
      const url = demand ? `/api/demands/${demand.id}` : '/api/demands'
      const method = demand ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(demand ? 'Demanda atualizada!' : 'Demanda criada!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar demanda')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-white font-semibold text-lg">{demand ? 'Editar Demanda' : 'Nova Demanda'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              type="text" value={form.title} required
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={inputCls} placeholder="Descreva a demanda brevemente"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              value={form.description} rows={3}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={cn(inputCls, 'resize-none')} placeholder="Detalhes adicionais"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoria *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className={inputCls}
              >
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>
          {demand && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className={inputCls}
              >
                <option value="open">Aberta</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvida</option>
                <option value="closed">Fechada</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Endereço</label>
            <input
              type="text" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className={inputCls} placeholder="Localização da demanda"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações</label>
            <textarea
              value={form.notes} rows={2}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {demand ? 'Salvar' : 'Criar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
