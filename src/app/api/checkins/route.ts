import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [checkins, total] = await Promise.all([
      prisma.checkin.findMany({
        where: { tenantId: session.tenantId },
        include: {
          user: { select: { name: true, cpf: true } },
          contact: { select: { name: true } },
          meeting: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.checkin.count({ where: { tenantId: session.tenantId } }),
    ])

    return NextResponse.json({
      checkins,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET checkins error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId || !session.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { lat, lng, address, notes, contactId, meetingId } = body

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Coordenadas GPS são obrigatórias' }, { status: 400 })
    }

    const checkin = await prisma.checkin.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || null,
        notes: notes || null,
        contactId: contactId || null,
        meetingId: meetingId || null,
      },
      include: {
        user: { select: { name: true, cpf: true } },
        contact: { select: { name: true } },
        meeting: { select: { title: true } },
      },
    })

    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('POST checkin error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
