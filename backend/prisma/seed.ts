import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const [engineering, sales] = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering', monthlyBudget: 10000, currency: 'USD' },
    }),
    prisma.department.upsert({
      where: { name: 'Sales' },
      update: {},
      create: { name: 'Sales', monthlyBudget: 15000, currency: 'USD' },
    }),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      passwordHash: await hash('Admin@1234'),
      role: UserRole.ADMIN,
      currency: 'USD',
    },
  });

  await prisma.user.upsert({
    where: { email: 'employer@acme.com' },
    update: {},
    create: {
      email: 'employer@acme.com',
      name: 'Jane Smith (Employer)',
      passwordHash: await hash('Employer@1234'),
      role: UserRole.EMPLOYER,
      currency: 'EUR',   // employer is in Europe
    },
  });

  await prisma.user.upsert({
    where: { email: 'alice@acme.com' },
    update: {},
    create: {
      email: 'alice@acme.com',
      name: 'Alice Johnson',
      passwordHash: await hash('Employee@1234'),
      role: UserRole.EMPLOYEE,
      currency: 'USD',
      departmentId: engineering.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'bob@acme.com' },
    update: {},
    create: {
      email: 'bob@acme.com',
      name: 'Bob Kumar',
      passwordHash: await hash('Employee@1234'),
      role: UserRole.EMPLOYEE,
      currency: 'INR',   // employee in India
      departmentId: sales.id,
    },
  });

  console.log('Seed complete.');
  console.log('  admin@acme.com       / Admin@1234    (ADMIN)');
  console.log('  employer@acme.com    / Employer@1234 (EMPLOYER, EUR)');
  console.log('  alice@acme.com       / Employee@1234 (EMPLOYEE, USD, Engineering)');
  console.log('  bob@acme.com         / Employee@1234 (EMPLOYEE, INR, Sales)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
