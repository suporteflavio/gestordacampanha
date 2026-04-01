import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signAccessToken, signRefreshToken, normalizeCpf } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, password } = body

    if (!cpf || !password) {
      return NextResponse.json({ error: 'CPF e senha são obrigatórios' }, { status: 400 })
    }

    const normalizedCpf = normalizeCpf(cpf)

    const user = await prisma.user.findUnique({
      where: { cpf: normalizedCpf },
      include: {
        tenantUsers: {
          where: { isActive: true },
          include: {
            tenant: true,
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'CPF ou senha incorretos' }, { status: 401 })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Conta bloqueada. Tente novamente em ${minutesLeft} minutos.` },
        { status: 401 }
      )
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash)

    if (!passwordValid) {
      const attempts = user.loginAttempts + 1
      const isLocked = attempts >= 5

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      })

      if (isLocked) {
        return NextResponse.json(
          { error: 'Muitas tentativas. Conta bloqueada por 15 minutos.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: `CPF ou senha incorretos. ${5 - attempts} tentativas restantes.` },
        { status: 401 }
      )
    }

    if (user.isRoot) {
      const accessToken = await signAccessToken({
        userId: user.id,
        cpf: user.cpf,
        tenantId: null,
        role: 'root',
        isRoot: true,
        permissions: {},
      })
      const refreshToken = await signRefreshToken({ userId: user.id, tenantId: null })

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
      })

      const response = NextResponse.json({
        user: { id: user.id, name: user.name, cpf: user.cpf, isRoot: true },
        needsTenantSelection: false,
        redirectTo: '/root',
      })

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
    }

    if (user.tenantUsers.length === 0) {
      return NextResponse.json({ error: 'Usuário sem acesso a nenhuma campanha' }, { status: 401 })
    }

    if (user.tenantUsers.length > 1) {
      const tempToken = await signAccessToken({
        userId: user.id,
        cpf: user.cpf,
        tenantId: null,
        role: 'standard',
        isRoot: false,
        permissions: {},
      })
      const refreshToken = await signRefreshToken({ userId: user.id, tenantId: null })

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
      })

      const response = NextResponse.json({
        user: { id: user.id, name: user.name, cpf: user.cpf },
        needsTenantSelection: true,
        tenants: user.tenantUsers.map((tu) => ({
          id: tu.tenant.id,
          name: tu.tenant.name,
          slug: tu.tenant.slug,
          logoUrl: tu.tenant.logoUrl,
          role: tu.role,
        })),
      })

      response.cookies.set('access_token', tempToken, {
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
    }

    const tenantUser = user.tenantUsers[0]
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
      userId: user.id,
      cpf: user.cpf,
      tenantId: tenantUser.tenantId,
      role: tenantUser.role,
      isRoot: false,
      permissions,
    })
    const refreshToken = await signRefreshToken({
      userId: user.id,
      tenantId: tenantUser.tenantId,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, cpf: user.cpf },
      needsTenantSelection: false,
      redirectTo: '/dashboard',
    })

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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
