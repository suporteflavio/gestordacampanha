import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.fuelVoucher.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Voucher não encontrado' }, { status: 404 })

    const body = await request.json()

    const voucher = await prisma.fuelVoucher.update({
      where: { id: id },
      data: {
        status: body.status ?? existing.status,
        approverId: body.approverId ?? existing.approverId,
        usedAt: body.status === 'used' ? new Date() : existing.usedAt,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    })

    return NextResponse.json(voucher)
  } catch (error) {
    console.error('PATCH fuel voucher error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
