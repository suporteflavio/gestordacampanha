import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: session.tenantId }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        include: { municipality: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.demand.count({ where }),
    ])

    return NextResponse.json({
      demands,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET demands error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { title, description, category, priority, municipalityId, address, notes } = body

    if (!title || !category) {
      return NextResponse.json({ error: 'Título e categoria são obrigatórios' }, { status: 400 })
    }

    const demand = await prisma.demand.create({
      data: {
        tenantId: session.tenantId,
        title,
        description: description || null,
        category,
        status: 'open',
        priority: priority || 'medium',
        municipalityId: municipalityId || null,
        address: address || null,
        notes: notes || null,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(demand, { status: 201 })
  } catch (error) {
    console.error('POST demand error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
