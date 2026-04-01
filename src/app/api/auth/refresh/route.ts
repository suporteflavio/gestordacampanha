import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token não encontrado' }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)

    if (!payload) {
      return NextResponse.json({ error: 'Refresh token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        tenantUsers: {
          where: {
            tenantId: payload.tenantId || undefined,
            isActive: true,
          },
          include: { permissions: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    }

    const tenantUser = user.tenantUsers[0]
    const permissions = tenantUser
      ? tenantUser.permissions.reduce(
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
      : {}

    const newAccessToken = await signAccessToken({
      userId: user.id,
      cpf: user.cpf,
      tenantId: payload.tenantId,
      role: tenantUser?.role || (user.isRoot ? 'root' : 'standard'),
      isRoot: user.isRoot,
      permissions,
    })

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
      tenantId: payload.tenantId,
    })

    const response = NextResponse.json({ success: true })

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
