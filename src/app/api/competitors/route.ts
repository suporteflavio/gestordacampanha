import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const competitors = await prisma.competitor.findMany({
      where: { tenantId: session.tenantId },
      include: { municipality: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(competitors)
  } catch (error) {
    console.error('GET competitors error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { name, party, position, municipalityId, previousVotes, declaredExpense, notes } = body

    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

    const competitor = await prisma.competitor.create({
      data: {
        tenantId: session.tenantId,
        name,
        party: party || null,
        position: position || null,
        municipalityId: municipalityId || null,
        previousVotes: previousVotes ? parseInt(previousVotes) : null,
        declaredExpense: declaredExpense ? parseFloat(declaredExpense) : null,
        notes: notes || null,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    console.error('POST competitor error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
