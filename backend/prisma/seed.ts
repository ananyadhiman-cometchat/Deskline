import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
});

async function main() {
  await prisma.refreshToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword('Password123!');

  await prisma.user.createMany({
    data: [
      { name: 'Admin User', email: 'admin@deskline.local', passwordHash, role: 'admin', department: 'General' },
      { name: 'Supervisor User', email: 'supervisor.it@deskline.local', passwordHash, role: 'supervisor', department: 'IT' },
      { name: 'Agent User', email: 'agent.it@deskline.local', passwordHash, role: 'agent', department: 'IT' },
      { name: 'Employee User', email: 'employee.it@deskline.local', passwordHash, role: 'employee', department: 'IT' }
    ]
  });

  await prisma.ticket.create({
    data: {
      title: 'Sample IT access issue',
      description: 'Employee cannot access internal tool.',
      category: 'IT',
      subType: 'action',
      priority: 'medium',
      status: 'open',
      employee: {
        create: {
          name: 'Seed Employee',
          email: 'employee.seed@deskline.local',
          passwordHash,
          role: 'employee',
          department: 'IT'
        }
      }
    }
  });

  console.log('Seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
