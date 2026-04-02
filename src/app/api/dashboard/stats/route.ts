import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const tenantId = session.tenantId
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [
      totalVoters,
      totalLeaders,
      activeLeaders,
      totalMeetings,
      meetingsThisMonth,
      incomeResult,
      expenseResult,
      totalFuelVouchers,
      totalDemands,
      openDemands,
      voteGoals,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId, type: 'voter' } }),
      prisma.contact.count({ where: { tenantId, type: 'leader' } }),
      prisma.contact.count({ where: { tenantId, type: 'leader', status: 'confirmed' } }),
      prisma.meeting.count({ where: { tenantId } }),
      prisma.meeting.count({
        where: { tenantId, scheduledAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.transaction.aggregate({
        where: { tenantId, type: 'income', status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { tenantId, type: 'expense', status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.fuelVoucher.count({ where: { tenantId } }),
      prisma.demand.count({ where: { tenantId } }),
      prisma.demand.count({ where: { tenantId, status: 'open' } }),
      prisma.voteGoal.aggregate({
        where: { tenantId },
        _sum: { targetVotes: true, currentVotes: true },
      }),
    ])

    const totalIncome = Number(incomeResult._sum.amount ?? 0)
    const totalExpense = Number(expenseResult._sum.amount ?? 0)

    return NextResponse.json({
      totalVoters,
      totalLeaders,
      activeLeaders,
      totalMeetings,
      meetingsThisMonth,
      totalIncome,
      totalExpense,
      financialBalance: totalIncome - totalExpense,
      totalFuelVouchers,
      totalDemands,
      openDemands,
      voteGoalTotal: voteGoals._sum.targetVotes ?? 0,
      voteGoalCurrent: voteGoals._sum.currentVotes ?? 0,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
