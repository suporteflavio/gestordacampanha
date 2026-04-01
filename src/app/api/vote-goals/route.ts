import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const goals = await prisma.voteGoal.findMany({
      where: { tenantId: session.tenantId },
      include: { municipality: { select: { id: true, name: true } } },
      orderBy: { municipality: { name: 'asc' } },
    })

    const totalTarget = goals.reduce((sum, g) => sum + g.targetVotes, 0)
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentVotes, 0)

    return NextResponse.json({ goals, totalTarget, totalCurrent })
  } catch (error) {
    console.error('GET vote goals error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { municipalityId, targetVotes, currentVotes, previousVotes } = body

    if (!municipalityId || !targetVotes) {
      return NextResponse.json({ error: 'Município e meta são obrigatórios' }, { status: 400 })
    }

    const goal = await prisma.voteGoal.upsert({
      where: { tenantId_municipalityId: { tenantId: session.tenantId, municipalityId } },
      update: {
        targetVotes: parseInt(targetVotes),
        currentVotes: currentVotes ? parseInt(currentVotes) : undefined,
        previousVotes: previousVotes ? parseInt(previousVotes) : undefined,
      },
      create: {
        tenantId: session.tenantId,
        municipalityId,
        targetVotes: parseInt(targetVotes),
        currentVotes: currentVotes ? parseInt(currentVotes) : 0,
        previousVotes: previousVotes ? parseInt(previousVotes) : null,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('POST vote goal error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
