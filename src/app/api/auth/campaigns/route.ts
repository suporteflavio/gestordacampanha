import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const tenantUsers = await prisma.tenantUser.findMany({
      where: { userId: session.userId, isActive: true },
      include: { tenant: true },
    })

    return NextResponse.json({
      campaigns: tenantUsers.map((tu) => ({
        id: tu.tenant.id,
        name: tu.tenant.name,
        slug: tu.tenant.slug,
        logoUrl: tu.tenant.logoUrl,
        role: tu.role,
      })),
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
