import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, slug: true, cnpj: true, primaryColor: true, secondaryColor: true, plan: true, status: true },
    })

    if (!tenant) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('GET campaign settings error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (session.role !== 'admin' && !session.isRoot) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        name: body.name,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
      },
      select: { id: true, name: true, slug: true, cnpj: true, primaryColor: true, secondaryColor: true, plan: true, status: true },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('PATCH campaign settings error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
