import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (session.role !== 'admin' && !session.isRoot) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const users = await prisma.tenantUser.findMany({
      where: { tenantId: session.tenantId },
      include: { user: { select: { id: true, name: true, cpf: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('GET settings users error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (session.role !== 'admin' && !session.isRoot) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

    const body = await request.json()
    const { cpf, name, password, role } = body

    if (!cpf || !name || !password) {
      return NextResponse.json({ error: 'CPF, nome e senha são obrigatórios' }, { status: 400 })
    }

    const normalizedCpf = cpf.replace(/\D/g, '')
    const passwordHash = await bcrypt.hash(password, 12)

    let user = await prisma.user.findUnique({ where: { cpf: normalizedCpf } })

    if (!user) {
      user = await prisma.user.create({
        data: { cpf: normalizedCpf, name, passwordHash },
      })
    }

    const existing = await prisma.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId: session.tenantId, userId: user.id } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Usuário já pertence a esta campanha' }, { status: 409 })
    }

    const tenantUser = await prisma.tenantUser.create({
      data: {
        tenantId: session.tenantId,
        userId: user.id,
        role: role || 'standard',
        isActive: true,
      },
      include: { user: { select: { id: true, name: true, cpf: true, email: true } } },
    })

    return NextResponse.json(tenantUser, { status: 201 })
  } catch (error) {
    console.error('POST settings user error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
