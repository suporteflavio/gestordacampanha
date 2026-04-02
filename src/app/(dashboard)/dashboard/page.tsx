'use client'

import { useEffect, useState } from 'react'
import { Users, UserCheck, CalendarDays, DollarSign, Target, Fuel, TrendingUp, Clock } from 'lucide-react'
import StatsCard from '@/components/ui/StatsCard'
import PageHeader from '@/components/ui/PageHeader'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalVoters: number
  totalLeaders: number
  activeLeaders: number
  totalMeetings: number
  meetingsThisMonth: number
  financialBalance: number
  totalIncome: number
  totalExpense: number
  totalFuelVouchers: number
  totalDemands: number
  openDemands: number
  voteGoalTotal: number
  voteGoalCurrent: number
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const electionDate = new Date('2026-10-05T08:00:00')

    function update() {
      const now = new Date()
      const diff = electionDate.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-5 mb-6">
      <p className="text-blue-300 text-sm font-medium mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Faltam para o dia da eleição (05/10/2026)
      </p>
      <div className="flex items-center gap-4">
        {[
          { value: timeLeft.days, label: 'Dias' },
          { value: timeLeft.hours, label: 'Horas' },
          { value: timeLeft.minutes, label: 'Minutos' },
          { value: timeLeft.seconds, label: 'Segundos' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-white tabular-nums">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-gray-400 text-xs">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) return
      const data = await response.json()
      setStats(data)
    } catch {
      console.error('Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const votePercentage =
    stats && stats.voteGoalTotal > 0
      ? Math.round((stats.voteGoalCurrent / stats.voteGoalTotal) * 100)
      : 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Visão geral da campanha — ${formatDate(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy")}`}
      />

      <Countdown />

      {/* Vote Goal Progress */}
      {(stats || loading) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Meta de Votos</span>
            </div>
            {!loading && stats && (
              <span
                className={`text-sm font-bold ${
                  votePercentage >= 100
                    ? 'text-green-400'
                    : votePercentage >= 60
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {votePercentage}%
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-4 bg-gray-700 rounded-full animate-pulse" />
          ) : (
            <>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    votePercentage >= 100
                      ? 'bg-green-500'
                      : votePercentage >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(votePercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{stats?.voteGoalCurrent?.toLocaleString('pt-BR')} votos estimados</span>
                <span>Meta: {stats?.voteGoalTotal?.toLocaleString('pt-BR')}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Eleitores"
          value={loading ? '...' : (stats?.totalVoters?.toLocaleString('pt-BR') ?? '0')}
          subtitle="Total na base"
          icon={<UserCheck className="w-4 h-4" />}
          color="blue"
          loading={loading}
        />
        <StatsCard
          title="Lideranças"
          value={loading ? '...' : (stats?.activeLeaders?.toLocaleString('pt-BR') ?? '0')}
          subtitle={loading ? '' : `${stats?.totalLeaders ?? 0} total`}
          icon={<Users className="w-4 h-4" />}
          color="purple"
          loading={loading}
        />
        <StatsCard
          title="Reuniões"
          value={loading ? '...' : (stats?.meetingsThisMonth?.toLocaleString('pt-BR') ?? '0')}
          subtitle="Este mês"
          icon={<CalendarDays className="w-4 h-4" />}
          color="yellow"
          loading={loading}
        />
        <StatsCard
          title="Saldo"
          value={loading ? '...' : formatCurrency(stats?.financialBalance ?? 0)}
          subtitle="Receita - Despesas"
          icon={<DollarSign className="w-4 h-4" />}
          color={!loading && (stats?.financialBalance ?? 0) < 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Demandas Abertas"
          value={loading ? '...' : (stats?.openDemands?.toLocaleString('pt-BR') ?? '0')}
          subtitle={loading ? '' : `${stats?.totalDemands ?? 0} total`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="red"
          loading={loading}
        />
        <StatsCard
          title="Vale-Combustível"
          value={loading ? '...' : (stats?.totalFuelVouchers?.toLocaleString('pt-BR') ?? '0')}
          subtitle="Vouchers emitidos"
          icon={<Fuel className="w-4 h-4" />}
          color="yellow"
          loading={loading}
        />
        <StatsCard
          title="Receita Total"
          value={loading ? '...' : formatCurrency(stats?.totalIncome ?? 0)}
          subtitle="Todas as receitas"
          icon={<DollarSign className="w-4 h-4" />}
          color="green"
          loading={loading}
        />
        <StatsCard
          title="Despesa Total"
          value={loading ? '...' : formatCurrency(stats?.totalExpense ?? 0)}
          subtitle="Todos os gastos"
          icon={<DollarSign className="w-4 h-4" />}
          color="red"
          loading={loading}
        />
      </div>
    </div>
  )
}
