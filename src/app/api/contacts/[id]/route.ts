import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      include: {
        municipality: { select: { name: true, ibgeCode: true } },
        parentLeader: { select: { id: true, name: true } },
        subLeaders: { select: { id: true, name: true, estimatedVotes: true } },
      },
    })

    if (!contact) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    return NextResponse.json(contact)
  } catch (error) {
    console.error('GET contact error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.contact.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })

    const body = await request.json()

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        cpf: body.cpf !== undefined ? (body.cpf ? body.cpf.replace(/\D/g, '') : null) : existing.cpf,
        phone: body.phone !== undefined ? (body.phone ? body.phone.replace(/\D/g, '') : null) : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        municipalityId: body.municipalityId !== undefined ? body.municipalityId : existing.municipalityId,
        neighborhood: body.neighborhood !== undefined ? body.neighborhood : existing.neighborhood,
        address: body.address !== undefined ? body.address : existing.address,
        lat: body.lat !== undefined ? (body.lat ? parseFloat(body.lat) : null) : existing.lat,
        lng: body.lng !== undefined ? (body.lng ? parseFloat(body.lng) : null) : existing.lng,
        type: body.type ?? existing.type,
        status: body.status ?? existing.status,
        engagementScore: body.engagementScore !== undefined ? parseInt(body.engagementScore) : existing.engagementScore,
        estimatedVotes: body.estimatedVotes !== undefined ? parseInt(body.estimatedVotes) : existing.estimatedVotes,
        parentLeaderId: body.parentLeaderId !== undefined ? body.parentLeaderId : existing.parentLeaderId,
        influenceGroup: body.influenceGroup !== undefined ? body.influenceGroup : existing.influenceGroup,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: { municipality: { select: { name: true } } },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('PATCH contact error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const existing = await prisma.contact.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
    })
    if (!existing) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })

    await prisma.contact.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE contact error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
