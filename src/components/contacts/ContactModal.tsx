'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'

interface Municipality {
  id: string
  name: string
}

interface ContactModalProps {
  type: 'leader' | 'voter'
  contact?: {
    id: string
    name: string
    cpf: string | null
    phone: string | null
    email: string | null
    municipalityId?: string | null
    neighborhood: string | null
    status: string
    engagementScore: number
    estimatedVotes: number
    influenceGroup: string | null
    notes: string | null
  } | null
  onClose: () => void
  onSaved: () => void
}

export default function ContactModal({ type, contact, onClose, onSaved }: ContactModalProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loading, setLoading] = useState(false)
  const [muniSearch, setMuniSearch] = useState('')
  const [form, setForm] = useState({
    name: contact?.name ?? '',
    cpf: contact?.cpf ? contact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
    phone: contact?.phone ? contact.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : '',
    email: contact?.email ?? '',
    municipalityId: contact?.municipalityId ?? '',
    neighborhood: contact?.neighborhood ?? '',
    status: contact?.status ?? 'confirmed',
    engagementScore: String(contact?.engagementScore ?? 5),
    estimatedVotes: String(contact?.estimatedVotes ?? 0),
    influenceGroup: contact?.influenceGroup ?? '',
    notes: contact?.notes ?? '',
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

  function formatCpfInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) {
      toast.error('Nome é obrigatório')
      return
    }
    setLoading(true)
    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = contact ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 409) {
          toast.warning(data.error)
          return
        }
        throw new Error(data.error)
      }
      toast.success(contact ? 'Contato atualizado!' : 'Contato cadastrado!')
      onSaved()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMunis = municipalities
    .filter(m => m.name.toLowerCase().includes(muniSearch.toLowerCase()))
    .slice(0, 20)

  const statusOptions = type === 'leader'
    ? [
        { value: 'confirmed', label: 'Ativo' },
        { value: 'probable', label: 'Frio' },
        { value: 'uncertain', label: 'Pendente' },
        { value: 'negative', label: 'Rompido' },
      ]
    : [
        { value: 'confirmed', label: 'Confirmado' },
        { value: 'probable', label: 'Provável' },
        { value: 'uncertain', label: 'Incerto' },
        { value: 'negative', label: 'Negativo' },
      ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">
            {contact ? 'Editar' : 'Nova'} {type === 'leader' ? 'Liderança' : 'Eleitor(a)'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: formatCpfInput(e.target.value) }))}
                placeholder="000.000.000-00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Telefone/WhatsApp</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: formatPhoneInput(e.target.value) }))}
                placeholder="(00) 00000-0000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Votos Estimados</label>
              <input
                type="number"
                min="0"
                value={form.estimatedVotes}
                onChange={e => setForm(f => ({ ...f, estimatedVotes: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {type === 'leader' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grupo de Influência</label>
                <input
                  type="text"
                  value={form.influenceGroup}
                  onChange={e => setForm(f => ({ ...f, influenceGroup: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Engajamento (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.engagementScore}
                  onChange={e => setForm(f => ({ ...f, engagementScore: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

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
              {contact ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
