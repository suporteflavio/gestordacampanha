import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect('/login')
  }

  if (!session.tenantId && !session.isRoot) {
    redirect('/campaigns')
  }

  let tenantName = 'CampanhaOS'

  if (session.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    })
    if (tenant) {
      tenantName = tenant.name
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar - Desktop */}
      <Sidebar
        role={session.role}
        isRoot={session.isRoot}
        permissions={session.permissions}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header
          userName={session.cpf}
          tenantName={tenantName}
          role={session.role}
          isRoot={session.isRoot}
        />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile */}
      <MobileNav role={session.role} isRoot={session.isRoot} />
    </div>
  )
}
