'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Target, X, Loader2, Pencil } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

interface VoteGoal {
  id: string
  municipalityId: string
  targetVotes: number
  currentVotes: number
  previousVotes: number | null
  municipality: { id: string; name: string }
}

interface GoalForm {
  municipalityId: string
  targetVotes: string
  currentVotes: string
  previousVotes: string
}

interface Municipality {
  id: string
  name: string
}

export default function VoteGoalsPage() {
  const [goals, setGoals] = useState<VoteGoal[]>([])
  const [totalTarget, setTotalTarget] = useState(0)
  const [totalCurrent, setTotalCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<VoteGoal | null>(null)

  useEffect(() => { fetchGoals() }, [])

  async function fetchGoals() {
    setLoading(true)
    try {
      const response = await fetch('/api/vote-goals')
      if (!response.ok) throw new Error()
      const data = await response.json()
      setGoals(data.goals)
      setTotalTarget(data.totalTarget)
      setTotalCurrent(data.totalCurrent)
    } catch {
      toast.error('Erro ao carregar metas de votos')
    } finally {
      setLoading(false)
    }
  }

  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0

  function openCreate() { setEditingGoal(null); setShowModal(true) }
  function openEdit(g: VoteGoal) { setEditingGoal(g); setShowModal(true) }

  return (
    <div>
      <PageHeader
        title="Metas de Votos"
        description="Acompanhamento de metas por município"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Definir Meta
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Meta Total" value={totalTarget.toLocaleString('pt-BR')} icon={<Target className="w-4 h-4" />} color="blue" loading={loading} />
        <StatsCard title="Votos Atuais" value={totalCurrent.toLocaleString('pt-BR')} color="green" loading={loading} />
        <StatsCard title="Progresso Geral" value={`${overallPct}%`} subtitle={`${totalCurrent.toLocaleString('pt-BR')} / ${totalTarget.toLocaleString('pt-BR')}`} color="purple" loading={loading} />
      </div>

      {!loading && totalTarget > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm font-medium">Progresso Total</span>
            <span className={cn('text-sm font-bold', overallPct >= 100 ? 'text-green-400' : overallPct >= 75 ? 'text-blue-400' : overallPct >= 50 ? 'text-yellow-400' : 'text-red-400')}>
              {overallPct}%
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className={cn('h-3 rounded-full transition-all', overallPct >= 100 ? 'bg-green-500' : overallPct >= 75 ? 'bg-blue-500' : overallPct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando metas..." />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="Nenhuma meta definida"
          description="Defina metas de votos por município para acompanhar o progresso da campanha."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Definir Meta
            </button>
          }
        />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Município</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Meta</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Atual</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Anterior</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium w-48">Progresso</th>
                  <th className="px-4 py-3 text-right text-gray-400 text-xs font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {goals.map(g => {
                  const pct = g.targetVotes > 0 ? Math.min(100, Math.round((g.currentVotes / g.targetVotes) * 100)) : 0
                  const barColor = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  const textColor = pct >= 100 ? 'text-green-400' : pct >= 75 ? 'text-blue-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <tr key={g.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-white text-sm font-medium">{g.municipality.name}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{g.targetVotes.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{g.currentVotes.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                        {g.previousVotes !== null ? g.previousVotes.toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className={cn('h-2 rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={cn('text-xs font-medium w-10 text-right', textColor)}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(g)} className="text-gray-400 hover:text-white transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <VoteGoalModal
          goal={editingGoal}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchGoals() }}
        />
      )}
    </div>
  )
}

function VoteGoalModal({
  goal,
  onClose,
  onSaved,
}: {
  goal: VoteGoal | null
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [form, setForm] = useState<GoalForm>(
    goal
      ? {
          municipalityId: goal.municipalityId,
          targetVotes: String(goal.targetVotes),
          currentVotes: String(goal.currentVotes),
          previousVotes: goal.previousVotes !== null ? String(goal.previousVotes) : '',
        }
      : { municipalityId: '', targetVotes: '', currentVotes: '0', previousVotes: '' }
  )

  useEffect(() => {
    fetch('/api/municipalities')
      .then(r => r.json())
      .then(d => setMunicipalities(Array.isArray(d) ? d : d.municipalities ?? []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.municipalityId || !form.targetVotes) { toast.error('Município e meta são obrigatórios'); return }
    setLoading(true)
    try {
      const response = await fetch('/api/vote-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(goal ? 'Meta atualizada!' : 'Meta definida!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar meta')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{goal ? 'Editar Meta' : 'Definir Meta de Votos'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Município *</label>
            <select
              value={form.municipalityId}
              onChange={e => setForm(f => ({ ...f, municipalityId: e.target.value }))}
              required disabled={!!goal}
              className={cn(inputCls, goal && 'opacity-60 cursor-not-allowed')}
            >
              <option value="">Selecione um município</option>
              {municipalities.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Meta de Votos *</label>
            <input
              type="number" min="1" value={form.targetVotes} required
              onChange={e => setForm(f => ({ ...f, targetVotes: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Votos Atuais</label>
            <input
              type="number" min="0" value={form.currentVotes}
              onChange={e => setForm(f => ({ ...f, currentVotes: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Votos Eleição Anterior</label>
            <input
              type="number" min="0" value={form.previousVotes}
              onChange={e => setForm(f => ({ ...f, previousVotes: e.target.value }))}
              className={inputCls}
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
              {goal ? 'Atualizar' : 'Definir Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
