'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Users, X, Loader2, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, cn } from '@/lib/utils'

interface Competitor {
  id: string
  name: string
  party: string | null
  position: string | null
  previousVotes: number | null
  declaredExpense: number | null
  notes: string | null
  createdAt: string
  municipality: { name: string } | null
}

interface CompetitorForm {
  name: string
  party: string
  position: string
  previousVotes: string
  declaredExpense: string
  notes: string
}

const emptyForm: CompetitorForm = {
  name: '',
  party: '',
  position: '',
  previousVotes: '',
  declaredExpense: '',
  notes: '',
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)

  useEffect(() => {
    fetchCompetitors()
  }, [])

  async function fetchCompetitors() {
    setLoading(true)
    try {
      const response = await fetch('/api/competitors')
      if (!response.ok) throw new Error()
      const data = await response.json()
      setCompetitors(data)
    } catch {
      toast.error('Erro ao carregar concorrentes')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCompetitor(id: string) {
    if (!confirm('Excluir este concorrente?')) return
    try {
      const response = await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      toast.success('Concorrente excluído')
      fetchCompetitors()
    } catch {
      toast.error('Erro ao excluir concorrente')
    }
  }

  function openCreate() { setEditingCompetitor(null); setShowModal(true) }
  function openEdit(c: Competitor) { setEditingCompetitor(c); setShowModal(true) }

  return (
    <div>
      <PageHeader
        title="Concorrentes"
        description="Análise e monitoramento de candidatos concorrentes"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Novo Concorrente
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando concorrentes..." />
        </div>
      ) : competitors.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="Nenhum concorrente cadastrado"
          description="Cadastre candidatos concorrentes para análise estratégica."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Novo Concorrente
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {competitors.map(c => (
            <CompetitorCard
              key={c.id}
              competitor={c}
              onEdit={() => openEdit(c)}
              onDelete={() => deleteCompetitor(c.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CompetitorModal
          competitor={editingCompetitor}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchCompetitors() }}
        />
      )}
    </div>
  )
}

function CompetitorCard({
  competitor: c,
  onEdit,
  onDelete,
}: {
  competitor: Competitor
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{c.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {c.party && (
              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                {c.party}
              </span>
            )}
            {c.position && (
              <span className="text-xs text-gray-400">{c.position}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-800 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {c.municipality && (
          <InfoRow label="Município" value={c.municipality.name} />
        )}
        {c.previousVotes !== null && (
          <InfoRow label="Votos anteriores" value={c.previousVotes.toLocaleString('pt-BR')} />
        )}
        {c.declaredExpense !== null && (
          <InfoRow label="Despesa declarada" value={formatCurrency(c.declaredExpense)} />
        )}
      </div>

      {c.notes && (
        <p className="mt-3 text-gray-500 text-xs border-t border-gray-800 pt-3 line-clamp-2">{c.notes}</p>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-300 text-sm font-medium">{value}</span>
    </div>
  )
}

function CompetitorModal({
  competitor,
  onClose,
  onSaved,
}: {
  competitor: Competitor | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CompetitorForm>(
    competitor
      ? {
          name: competitor.name,
          party: competitor.party ?? '',
          position: competitor.position ?? '',
          previousVotes: competitor.previousVotes !== null ? String(competitor.previousVotes) : '',
          declaredExpense: competitor.declaredExpense !== null ? String(competitor.declaredExpense) : '',
          notes: competitor.notes ?? '',
        }
      : emptyForm
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    setLoading(true)
    try {
      const url = competitor ? `/api/competitors/${competitor.id}` : '/api/competitors'
      const method = competitor ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(competitor ? 'Concorrente atualizado!' : 'Concorrente cadastrado!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-white font-semibold text-lg">{competitor ? 'Editar Concorrente' : 'Novo Concorrente'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text" value={form.name} required
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={inputCls} placeholder="Nome do candidato"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Partido</label>
              <input
                type="text" value={form.party}
                onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                className={inputCls} placeholder="Ex: PT, PL, MDB"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cargo</label>
              <input
                type="text" value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className={inputCls} placeholder="Ex: Vereador"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Votos anteriores</label>
              <input
                type="number" min="0" value={form.previousVotes}
                onChange={e => setForm(f => ({ ...f, previousVotes: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Despesa declarada (R$)</label>
              <input
                type="number" step="0.01" min="0" value={form.declaredExpense}
                onChange={e => setForm(f => ({ ...f, declaredExpense: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações</label>
            <textarea
              value={form.notes} rows={3}
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
              {competitor ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
