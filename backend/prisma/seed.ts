import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@deskline.local',
      passwordHash: 'seeded-password',
      role: 'admin',
      department: 'General'
    }
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
          email: 'employee@deskline.local',
          passwordHash: 'seeded-password',
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
