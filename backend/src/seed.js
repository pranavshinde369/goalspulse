const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@goalspulse.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@goalspulse.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    }
  })

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@goalspulse.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'manager@goalspulse.com',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
    }
  })

  // Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@goalspulse.com' },
    update: {},
    create: {
      name: 'Priya Mehta',
      email: 'employee@goalspulse.com',
      password: await bcrypt.hash('employee123', 10),
      role: 'EMPLOYEE',
      managerId: manager.id,
    }
  })

  console.log('✅ Seeded users:')
  console.log(`   Admin    → admin@goalspulse.com / admin123`)
  console.log(`   Manager  → manager@goalspulse.com / manager123`)
  console.log(`   Employee → employee@goalspulse.com / employee123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())