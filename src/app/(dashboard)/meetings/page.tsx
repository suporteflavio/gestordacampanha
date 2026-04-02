'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Calendar, X, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate, getStatusLabel, getStatusColor, formatCurrency, cn } from '@/lib/utils'

interface Meeting {
  id: string
  title: string
  type: string
  status: string
  scheduledAt: string
  address: string | null
  estimatedCost: number | null
  attendeesCount: number
  qrCode: string
  municipality: { name: string } | null
  notes: string | null
}

interface Municipality {
  id: string
  name: string
}

const MEETING_TYPES = [
  { value: 'meeting', label: 'Reunião' },
  { value: 'visit', label: 'Visita' },
  { value: 'rally', label: 'Comício' },
  { value: 'event', label: 'Evento' },
]

const TYPE_LABELS: Record<string, string> = {
  meeting: 'Reunião',
  visit: 'Visita',
  rally: 'Comício',
  event: 'Evento',
}

interface MeetingModalProps {
  meeting?: Meeting | null
  onClose: () => void
  onSaved: () => void
}

function MeetingModal({ meeting, onClose, onSaved }: MeetingModalProps) {
  const [loading, setLoading] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [muniSearch, setMuniSearch] = useState('')
  const [form, setForm] = useState({
    title: meeting?.title ?? '',
    type: meeting?.type ?? 'meeting',
    scheduledAt: meeting?.scheduledAt
      ? new Date(meeting.scheduledAt).toISOString().slice(0, 16)
      : '',
    municipalityId: '',
    address: meeting?.address ?? '',
    estimatedCost: meeting?.estimatedCost ? String(meeting.estimatedCost) : '',
    notes: meeting?.notes ?? '',
  })

  useEffect(() => {
    fetchMunicipalities()
  }, [])

  async function fetchMunicipalities() {
    try {
      const response = await fetch('/api/municipalities')
      if (!response.ok) return
      const data = await response.json()
      setMunicipalities(data)
    } catch {
      console.error('Failed to load municipalities')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.scheduledAt) {
      toast.error('Título e data são obrigatórios')
      return
    }
    setLoading(true)
    try {
      const url = meeting ? `/api/meetings/${meeting.id}` : '/api/meetings'
      const method = meeting ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      toast.success(meeting ? 'Reunião atualizada!' : 'Reunião criada!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const filteredMunis = municipalities
    .filter(m => m.name.toLowerCase().includes(muniSearch.toLowerCase()))
    .slice(0, 20)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            {meeting ? 'Editar Reunião' : 'Nova Reunião'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MEETING_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data e Hora *</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Município (GO)</label>
            <input
              type="text"
              placeholder="Buscar município..."
              value={muniSearch}
              onChange={e => setMuniSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            />
            <select
              value={form.municipalityId}
              onChange={e => setForm(f => ({ ...f, municipalityId: e.target.value }))}
              size={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {filteredMunis.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Custo Estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.estimatedCost}
              onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {meeting ? 'Salvar' : 'Criar Reunião'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'scheduled' | 'done'>('scheduled')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    fetchMeetings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page])

  async function fetchMeetings() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: activeTab, page: String(page), limit: '20' })
      const response = await fetch(`/api/meetings?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setMeetings(data.meetings)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar reuniões')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta reunião?')) return
    try {
      const response = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error()
      toast.success('Reunião excluída')
      fetchMeetings()
    } catch {
      toast.error('Erro ao excluir reunião')
    }
  }

  async function handleMarkDone(id: string) {
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      })
      if (!response.ok) throw new Error()
      toast.success('Reunião marcada como realizada!')
      fetchMeetings()
    } catch {
      toast.error('Erro ao atualizar reunião')
    }
  }

  function handleEdit(m: Meeting) {
    setEditingMeeting(m)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setEditingMeeting(null)
  }

  function handleSaved() {
    handleCloseModal()
    fetchMeetings()
  }

  return (
    <div>
      <PageHeader
        title="Reuniões"
        description="Agende e acompanhe reuniões, visitas e eventos"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Nova Reunião
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        {([
          { key: 'scheduled', label: 'Agendadas' },
          { key: 'done', label: 'Realizadas' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1) }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando reuniões..." />
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title={`Nenhuma reunião ${activeTab === 'scheduled' ? 'agendada' : 'realizada'}`}
          description="Agende reuniões, visitas e eventos para organizar a agenda da campanha."
          action={
            activeTab === 'scheduled' ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                Agendar Reunião
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Título</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Município</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Data</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Participantes</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Custo Est.</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                  <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map(m => (
                  <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-sm">{m.title}</p>
                      {m.address && (
                        <p className="text-gray-500 text-xs truncate max-w-[200px]">{m.address}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-gray-400 text-xs bg-gray-800 px-2 py-1 rounded">
                        {TYPE_LABELS[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {m.municipality?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {formatDate(m.scheduledAt, 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {(m.attendeesCount ?? 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                      {m.estimatedCost ? formatCurrency(m.estimatedCost) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', getStatusColor(m.status))}>
                        {getStatusLabel(m.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === 'scheduled' && (
                          <button
                            onClick={() => handleMarkDone(m.id)}
                            className="text-green-400 hover:text-green-300 text-xs font-medium transition"
                          >
                            Realizada
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(m)}
                          className="text-blue-400 hover:text-blue-300 text-xs font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-medium transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <MeetingModal
          meeting={editingMeeting}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
