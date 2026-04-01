import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Top 30 municipalities of Goiás by population + all others
const municipalities = [
  { ibgeCode: '5208707', name: 'Goiânia', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.6864, lng: -49.2643 },
  { ibgeCode: '5201405', name: 'Aparecida de Goiânia', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.8234, lng: -49.2497 },
  { ibgeCode: '5201108', name: 'Anápolis', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.3282, lng: -48.9522 },
  { ibgeCode: '5221858', name: 'Rio Verde', uf: 'GO', mesoregion: 'Sul Goiano', lat: -17.7978, lng: -50.9278 },
  { ibgeCode: '5212801', name: 'Luziânia', uf: 'GO', mesoregion: 'Leste Goiano', lat: -16.2526, lng: -47.9508 },
  { ibgeCode: '5200258', name: 'Águas Lindas de Goiás', uf: 'GO', mesoregion: 'Leste Goiano', lat: -15.7458, lng: -48.2827 },
  { ibgeCode: '5219803', name: 'Valparaíso de Goiás', uf: 'GO', mesoregion: 'Leste Goiano', lat: -16.0752, lng: -47.9744 },
  { ibgeCode: '5221197', name: 'Trindade', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.6523, lng: -49.4917 },
  { ibgeCode: '5205109', name: 'Caldas Novas', uf: 'GO', mesoregion: 'Sul Goiano', lat: -17.7431, lng: -48.6248 },
  { ibgeCode: '5215231', name: 'Novo Gama', uf: 'GO', mesoregion: 'Leste Goiano', lat: -16.0538, lng: -48.0308 },
  { ibgeCode: '5210802', name: 'Itumbiara', uf: 'GO', mesoregion: 'Sul Goiano', lat: -18.4186, lng: -49.2147 },
  { ibgeCode: '5203203', name: 'Catalão', uf: 'GO', mesoregion: 'Leste Goiano', lat: -18.1669, lng: -47.9475 },
  { ibgeCode: '5213103', name: 'Mineiros', uf: 'GO', mesoregion: 'Sul Goiano', lat: -17.5683, lng: -52.5515 },
  { ibgeCode: '5218003', name: 'Senador Canedo', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.7045, lng: -49.0913 },
  { ibgeCode: '5207808', name: 'Formosa', uf: 'GO', mesoregion: 'Leste Goiano', lat: -15.5352, lng: -47.3323 },
  { ibgeCode: '5205521', name: 'Campo Grande', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.4719, lng: -49.3358 },
  { ibgeCode: '5208806', name: 'Goianésia', uf: 'GO', mesoregion: 'Centro Goiano', lat: -15.3200, lng: -49.1127 },
  { ibgeCode: '5211503', name: 'Jataí', uf: 'GO', mesoregion: 'Sul Goiano', lat: -17.8791, lng: -51.7161 },
  { ibgeCode: '5210208', name: 'Inhumas', uf: 'GO', mesoregion: 'Centro Goiano', lat: -16.3598, lng: -49.4910 },
  { ibgeCode: '5217609', name: 'Planaltina', uf: 'GO', mesoregion: 'Leste Goiano', lat: -15.4532, lng: -47.6139 },
  { ibgeCode: '5219357', name: 'Santo Antônio do Descoberto', uf: 'GO', mesoregion: 'Leste Goiano', lat: -15.9423, lng: -48.2573 },
  { ibgeCode: '5221452', name: 'Quirinópolis', uf: 'GO', mesoregion: 'Sul Goiano', lat: -18.4454, lng: -50.4518 },
  { ibgeCode: '5211404', name: 'Jaraguá', uf: 'GO', mesoregion: 'Centro Goiano', lat: -15.7560, lng: -49.3324 },
  { ibgeCode: '5209705', name: 'Goiatuba', uf: 'GO', mesoregion: 'Sul Goiano', lat: -18.0134, lng: -49.3574 },
  { ibgeCode: '5213707', name: 'Morrinhos', uf: 'GO', mesoregion: 'Sul Goiano', lat: -17.7340, lng: -49.1046 },
  { ibgeCode: '5221403', name: 'Uruaçu', uf: 'GO', mesoregion: 'Norte Goiano', lat: -14.5239, lng: -49.1417 },
  { ibgeCode: '5217302', name: 'Porangatu', uf: 'GO', mesoregion: 'Norte Goiano', lat: -13.4403, lng: -49.1488 },
  { ibgeCode: '5205703', name: 'Ceres', uf: 'GO', mesoregion: 'Centro Goiano', lat: -15.3066, lng: -49.5981 },
  { ibgeCode: '5221809', name: 'São Luís de Montes Belos', uf: 'GO', mesoregion: 'Noroeste Goiano', lat: -16.5264, lng: -50.3703 },
  { ibgeCode: '5202405', name: 'Aragarças', uf: 'GO', mesoregion: 'Noroeste Goiano', lat: -15.8982, lng: -52.2423 },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Create municipalities
  console.log('Creating municipalities...')
  for (const muni of municipalities) {
    await prisma.municipality.upsert({
      where: { ibgeCode: muni.ibgeCode },
      update: {},
      create: {
        ibgeCode: muni.ibgeCode,
        name: muni.name,
        uf: muni.uf,
        mesoregion: muni.mesoregion,
        lat: muni.lat,
        lng: muni.lng,
      },
    })
  }
  console.log(`✓ Created ${municipalities.length} municipalities`)

  // Create root user
  const rootCpf = process.env.ROOT_CPF || '000.000.000-00'
  const rootPassword = process.env.ROOT_PASSWORD || 'admin123'
  const rootPasswordHash = await bcrypt.hash(rootPassword, 12)

  const rootUser = await prisma.user.upsert({
    where: { cpf: rootCpf.replace(/\D/g, '') },
    update: {},
    create: {
      cpf: rootCpf.replace(/\D/g, ''),
      name: 'Root Administrator',
      email: 'root@campanhaos.com.br',
      passwordHash: rootPasswordHash,
      isRoot: true,
    },
  })
  console.log('✓ Root user created:', rootUser.cpf)

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { cnpj: '00000000000000' },
    update: {},
    create: {
      cnpj: '00000000000000',
      name: 'Campanha Demonstração',
      slug: 'demo',
      primaryColor: '#1a56db',
      secondaryColor: '#7e3af2',
      plan: 'pro',
      status: 'active',
    },
  })
  console.log('✓ Demo tenant created:', demoTenant.slug)

  // Create demo admin user
  const demoPasswordHash = await bcrypt.hash('demo123', 12)
  const demoAdmin = await prisma.user.upsert({
    where: { cpf: '00000000000' },
    update: {},
    create: {
      cpf: '00000000000',
      name: 'Admin Demonstração',
      email: 'admin@demo.com.br',
      passwordHash: demoPasswordHash,
      isRoot: false,
    },
  })
  console.log('✓ Demo admin user created:', demoAdmin.cpf)

  // Link demo admin to demo tenant
  const tenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: demoTenant.id, userId: demoAdmin.id } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      userId: demoAdmin.id,
      role: 'admin',
      isActive: true,
    },
  })

  // Create all permissions for demo admin
  const modules = [
    'leaders', 'voters', 'meetings', 'finance', 'fuel_vouchers',
    'vote_goals', 'team', 'demands', 'marketing', 'analytics',
    'reports', 'competitors', 'audit_logs', 'documents', 'tasks',
  ]
  for (const mod of modules) {
    await prisma.permission.upsert({
      where: { tenantUserId_module: { tenantUserId: tenantUser.id, module: mod } },
      update: {},
      create: {
        tenantUserId: tenantUser.id,
        module: mod,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    })
  }
  console.log('✓ Demo admin permissions created')

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
