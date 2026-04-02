import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.transaction.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })

    const body = await request.json()
    const transaction = await prisma.transaction.update({
      where: { id: id },
      data: {
        category: body.category ?? existing.category,
        description: body.description ?? existing.description,
        amount: body.amount !== undefined ? parseFloat(body.amount) : existing.amount,
        status: body.status ?? existing.status,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
        paidAt: body.paidAt !== undefined ? (body.paidAt ? new Date(body.paidAt) : null) : existing.paidAt,
        supplier: body.supplier !== undefined ? body.supplier : existing.supplier,
        municipalityId: body.municipalityId !== undefined ? body.municipalityId : existing.municipalityId,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    })
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('PATCH transaction error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.transaction.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.transaction.delete({ where: { id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE transaction error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
