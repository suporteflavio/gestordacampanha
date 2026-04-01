import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: session.tenantId }
    if (status) where.status = status

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: { municipality: { select: { name: true } } },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ])

    return NextResponse.json({
      meetings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET meetings error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { title, type, scheduledAt, municipalityId, address, lat, lng, estimatedCost, notes } = body

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: 'Título e data são obrigatórios' }, { status: 400 })
    }

    const qrCode = `MTG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const meeting = await prisma.meeting.create({
      data: {
        tenantId: session.tenantId,
        title,
        type: type || 'meeting',
        status: 'scheduled',
        scheduledAt: new Date(scheduledAt),
        municipalityId: municipalityId || null,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes: notes || null,
        qrCode,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('POST meeting error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
