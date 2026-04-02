import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (session.role !== 'admin' && !session.isRoot) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { id: id, tenantId: session.tenantId },
    })
    if (!tenantUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (tenantUser.userId === session.userId && body.isActive === false) {
      return NextResponse.json({ error: 'Você não pode desativar sua própria conta' }, { status: 400 })
    }

    const updated = await prisma.tenantUser.update({
      where: { id: id },
      data: {
        isActive: body.isActive !== undefined ? body.isActive : tenantUser.isActive,
        role: body.role ?? tenantUser.role,
      },
      include: { user: { select: { id: true, name: true, cpf: true, email: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH settings user error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
