import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const municipalities = await prisma.municipality.findMany({
      where: { uf: 'GO' },
      select: { id: true, name: true, ibgeCode: true, lat: true, lng: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(municipalities)
  } catch (error) {
    console.error('Municipalities error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
