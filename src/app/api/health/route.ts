import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const start = Date.now()
  const status = { status: 'ok', timestamp: new Date().toISOString(), services: { database: 'unknown' }, latency: 0 }

  try {
    await prisma.$queryRaw`SELECT 1`
    status.services.database = 'ok'
  } catch {
    status.services.database = 'error'
    status.status = 'degraded'
  }

  status.latency = Date.now() - start

  const httpStatus = status.status === 'ok' ? 200 : 503
  return NextResponse.json(status, { status: httpStatus })
}
