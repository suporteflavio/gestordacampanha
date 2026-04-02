import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senhas são obrigatórias' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 8 caracteres' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH password error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
