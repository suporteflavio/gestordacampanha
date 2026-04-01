'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Fuel, X, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils'

interface FuelVoucher {
  id: string
  code: string
  fuelType: string
  liters: string
  value: string
  status: string
  issuedAt: string
  usedAt: string | null
  expiresAt: string | null
  notes: string | null
  station: { name: string } | null
  beneficiary: { name: string; cpf: string | null } | null
}

const fuelTypeLabels: Record<string, string> = {
  gasoline: 'Gasolina',
  ethanol: 'Etanol',
  diesel: 'Diesel',
}

export default function FuelVouchersPage() {
  const [vouchers, setVouchers] = useState<FuelVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchVouchers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  async function fetchVouchers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const response = await fetch(`/api/fuel-vouchers?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setVouchers(data.vouchers)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar vouchers')
    } finally {
      setLoading(false)
    }
  }

  async function cancelVoucher(id: string) {
    if (!confirm('Cancelar este voucher?')) return
    try {
      const response = await fetch(`/api/fuel-vouchers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!response.ok) throw new Error()
      toast.success('Voucher cancelado')
      fetchVouchers()
    } catch {
      toast.error('Erro ao cancelar voucher')
    }
  }

  const issued = vouchers.filter(v => v.status === 'issued').length
  const used = vouchers.filter(v => v.status === 'used').length
  const cancelled = vouchers.filter(v => v.status === 'cancelled').length

  return (
    <div>
      <PageHeader
        title="Vale-Combustível"
        description="Emissão e controle de vouchers de combustível"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> Emitir Voucher
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total" value={vouchers.length} icon={<Fuel className="w-4 h-4" />} color="blue" loading={loading} />
        <StatsCard title="Emitidos" value={issued} subtitle="Aguardando uso" color="yellow" loading={loading} />
        <StatsCard title="Utilizados" value={used} color="green" loading={loading} />
        <StatsCard title="Cancelados" value={cancelled} color="red" loading={loading} />
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="issued">Emitidos</option>
          <option value="used">Utilizados</option>
          <option value="cancelled">Cancelados</option>
          <option value="expired">Vencidos</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando vouchers..." />
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState
          icon={<Fuel className="w-8 h-8" />}
          title="Nenhum voucher encontrado"
          description="Emita vouchers de combustível para os membros da equipe."
          action={
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> Emitir Voucher
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
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Código</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Combustível</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Litros</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Valor</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Beneficiário</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Emitido em</th>
                    <th className="px-4 py-3 text-right text-gray-400 text-xs font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-white text-sm font-mono">{v.code}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{fuelTypeLabels[v.fuelType] ?? v.fuelType}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{parseFloat(v.liters).toFixed(2)}L</td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{formatCurrency(v.value)}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{v.beneficiary?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium', getStatusColor(v.status))}>{getStatusLabel(v.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">{formatDate(v.issuedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {v.status === 'issued' && (
                          <button
                            onClick={() => cancelVoucher(v.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-medium transition"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
        <IssueVoucherModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchVouchers() }}
        />
      )}
    </div>
  )
}

function IssueVoucherModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fuelType: 'gasoline', liters: '', value: '', expiresAt: '', notes: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.liters || !form.value) { toast.error('Litros e valor são obrigatórios'); return }
    setLoading(true)
    try {
      const response = await fetch('/api/fuel-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Voucher emitido!')
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao emitir voucher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">Emitir Vale-Combustível</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de Combustível *</label>
            <select
              value={form.fuelType}
              onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gasoline">Gasolina</option>
              <option value="ethanol">Etanol</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Litros *</label>
              <input
                type="number" step="0.01" min="0.01" value={form.liters}
                onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor (R$) *</label>
              <input
                type="number" step="0.01" min="0.01" value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Validade</label>
            <input
              type="date" value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Observações</label>
            <textarea
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
              Emitir Voucher
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
