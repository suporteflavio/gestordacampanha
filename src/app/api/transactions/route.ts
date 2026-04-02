import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: session.tenantId }
    if (type) where.type = type
    if (status) where.status = status
    if (category) where.category = category

    const [transactions, total, summary] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { municipality: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { tenantId: session.tenantId, status: 'paid' },
        _sum: { amount: true },
      }),
    ])

    const income = summary.find(s => s.type === 'income')?._sum.amount ?? 0
    const expense = summary.find(s => s.type === 'expense')?._sum.amount ?? 0

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        income: Number(income),
        expense: Number(expense),
        balance: Number(income) - Number(expense),
      },
    })
  } catch (error) {
    console.error('GET transactions error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { type, category, description, amount, status, dueDate, supplier, municipalityId, notes } = body

    if (!type || !category || !description || !amount) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        tenantId: session.tenantId,
        type,
        category,
        description,
        amount: parseFloat(amount),
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        supplier: supplier || null,
        municipalityId: municipalityId || null,
        notes: notes || null,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('POST transaction error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
