import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.demand.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Demanda não encontrada' }, { status: 404 })

    const body = await request.json()
    const demand = await prisma.demand.update({
      where: { id: id },
      data: {
        title: body.title ?? existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        category: body.category ?? existing.category,
        status: body.status ?? existing.status,
        priority: body.priority ?? existing.priority,
        municipalityId: body.municipalityId !== undefined ? body.municipalityId : existing.municipalityId,
        address: body.address !== undefined ? body.address : existing.address,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    })
    return NextResponse.json(demand)
  } catch (error) {
    console.error('PATCH demand error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.demand.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.demand.delete({ where: { id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE demand error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
