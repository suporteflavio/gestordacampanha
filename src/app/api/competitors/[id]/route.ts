import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.competitor.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Concorrente não encontrado' }, { status: 404 })

    const body = await request.json()
    const competitor = await prisma.competitor.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        party: body.party !== undefined ? body.party : existing.party,
        position: body.position !== undefined ? body.position : existing.position,
        municipalityId: body.municipalityId !== undefined ? body.municipalityId : existing.municipalityId,
        previousVotes: body.previousVotes !== undefined ? (body.previousVotes ? parseInt(body.previousVotes) : null) : existing.previousVotes,
        declaredExpense: body.declaredExpense !== undefined ? (body.declaredExpense ? parseFloat(body.declaredExpense) : null) : existing.declaredExpense,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: { municipality: { select: { name: true } } },
    })
    return NextResponse.json(competitor)
  } catch (error) {
    console.error('PATCH competitor error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.competitor.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.competitor.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE competitor error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
