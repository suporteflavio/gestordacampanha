import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession, signAccessToken, signRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { tenantId } = await request.json()

    const tenantUser = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId, userId: session.userId },
      },
      include: { permissions: true, tenant: true },
    })

    if (!tenantUser || !tenantUser.isActive) {
      return NextResponse.json({ error: 'Acesso negado a esta campanha' }, { status: 403 })
    }

    const permissions = tenantUser.permissions.reduce(
      (acc, p) => {
        acc[p.module] = {
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        }
        return acc
      },
      {} as Record<string, { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }>
    )

    const accessToken = await signAccessToken({
      userId: session.userId,
      cpf: session.cpf,
      tenantId,
      role: tenantUser.role,
      isRoot: false,
      permissions,
    })

    const refreshToken = await signRefreshToken({ userId: session.userId, tenantId })

    const response = NextResponse.json({ success: true })

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Select campaign error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
