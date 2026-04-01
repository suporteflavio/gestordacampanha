'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MapPin, Loader2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

interface Checkin {
  id: string
  lat: number
  lng: number
  address: string | null
  notes: string | null
  createdAt: string
  user: { name: string; cpf: string | null }
  contact: { name: string } | null
  meeting: { title: string } | null
}

export default function CheckinsPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [notes, setNotes] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => { fetchCheckins() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCheckins() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const response = await fetch(`/api/checkins?${params}`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setCheckins(data.checkins)
      setTotalPages(data.pagination.pages)
    } catch {
      toast.error('Erro ao carregar check-ins')
    } finally {
      setLoading(false)
    }
  }

  async function registerCheckin() {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste dispositivo')
      return
    }

    setRegistering(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        })
      })

      const { latitude: lat, longitude: lng } = position.coords

      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, notes: notes || null }),
      })

      if (!response.ok) throw new Error((await response.json()).error)
      toast.success('Check-in registrado!')
      setNotes('')
      fetchCheckins()
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Permissão de localização negada')
        } else if (err.code === err.TIMEOUT) {
          toast.error('Tempo esgotado ao obter localização')
        } else {
          toast.error('Não foi possível obter a localização')
        }
      } else {
        toast.error(err instanceof Error ? err.message : 'Erro ao registrar check-in')
      }
    } finally {
      setRegistering(false)
    }
  }

  const todayCount = checkins.filter(c => {
    const d = new Date(c.createdAt)
    const now = new Date()
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div>
      <PageHeader
        title="Check-ins GPS"
        description="Registro de visitas e localizações da equipe"
        action={
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observação (opcional)"
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <button
              onClick={registerCheckin}
              disabled={registering}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {registering ? 'Obtendo GPS...' : 'Registrar Check-in'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total" value={checkins.length} icon={<MapPin className="w-4 h-4" />} color="blue" loading={loading} />
        <StatsCard title="Hoje" value={todayCount} color="green" loading={loading} />
        <StatsCard title="Esta Página" value={checkins.length} color="purple" loading={loading} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Carregando check-ins..." />
        </div>
      ) : checkins.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-8 h-8" />}
          title="Nenhum check-in registrado"
          description="Registre check-ins com GPS para rastrear visitas e deslocamentos da equipe."
          action={
            <button
              onClick={registerCheckin}
              disabled={registering}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Registrar Check-in
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
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Usuário</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Data/Hora</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Coordenadas</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden lg:table-cell">Endereço</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium hidden md:table-cell">Contato/Reunião</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map(c => (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{c.user.name}</p>
                        {c.user.cpf && <p className="text-gray-500 text-xs">{c.user.cpf}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono hidden md:table-cell">
                        {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">
                        {c.address ?? (
                          <a
                            href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Ver no mapa
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                        {c.contact?.name ?? c.meeting?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{c.notes ?? '-'}</td>
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
    </div>
  )
}
