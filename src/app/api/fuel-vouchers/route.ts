import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateCode } from '@/lib/utils'

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

    const [vouchers, total] = await Promise.all([
      prisma.fuelVoucher.findMany({
        where,
        include: {
          station: { select: { name: true } },
          beneficiary: { select: { name: true, cpf: true } },
          approver: { select: { name: true } },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fuelVoucher.count({ where }),
    ])

    return NextResponse.json({
      vouchers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET fuel vouchers error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.tenantId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { stationId, beneficiaryId, fuelType, liters, value, expiresAt, notes } = body

    if (!fuelType || !liters || !value) {
      return NextResponse.json({ error: 'Tipo de combustível, litros e valor são obrigatórios' }, { status: 400 })
    }

    const code = generateCode('VCB-', 8)

    const voucher = await prisma.fuelVoucher.create({
      data: {
        tenantId: session.tenantId,
        code,
        stationId: stationId || null,
        beneficiaryId: beneficiaryId || null,
        fuelType,
        liters: parseFloat(liters),
        value: parseFloat(value),
        status: 'issued',
        qrCode: code,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
      },
      include: {
        station: { select: { name: true } },
        beneficiary: { select: { name: true, cpf: true } },
      },
    })

    return NextResponse.json(voucher, { status: 201 })
  } catch (error) {
    console.error('POST fuel voucher error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
