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
    const search = searchParams.get('search')
    const municipalityId = searchParams.get('municipalityId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: session.tenantId }
    if (type) where.type = type
    if (status) where.status = status
    if (municipalityId) where.municipalityId = municipalityId
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { municipality: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET contacts error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const {
      name, cpf, phone, email, municipalityId, neighborhood, address,
      lat, lng, type, status, engagementScore, estimatedVotes,
      parentLeaderId, influenceGroup, origin, notes,
    } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    if (cpf || phone) {
      const orConditions: Array<{ cpf?: string; phone?: string }> = []
      if (cpf) orConditions.push({ cpf: cpf.replace(/\D/g, '') })
      if (phone) orConditions.push({ phone: phone.replace(/\D/g, '') })

      if (orConditions.length > 0) {
        const existing = await prisma.contact.findFirst({
          where: { tenantId: session.tenantId, OR: orConditions },
        })
        if (existing) {
          return NextResponse.json({
            error: 'Já existe um contato com este CPF ou telefone',
            existingId: existing.id,
          }, { status: 409 })
        }
      }
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId: session.tenantId,
        name,
        cpf: cpf ? cpf.replace(/\D/g, '') : null,
        phone: phone ? phone.replace(/\D/g, '') : null,
        email: email || null,
        municipalityId: municipalityId || null,
        neighborhood: neighborhood || null,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        type,
        status: status || 'confirmed',
        engagementScore: engagementScore ? parseInt(engagementScore) : 5,
        estimatedVotes: estimatedVotes ? parseInt(estimatedVotes) : 0,
        parentLeaderId: parentLeaderId || null,
        influenceGroup: influenceGroup || null,
        origin: origin || null,
        notes: notes || null,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('POST contact error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
