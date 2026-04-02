import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken, getTokenFromRequest } from '@/lib/auth'

const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/capture',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = getTokenFromRequest(request)

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyAccessToken(token)

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('access_token')
    return response
  }

  if (!payload.tenantId && !payload.isRoot && pathname !== '/campaigns') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Campanha não selecionada' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/campaigns', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
