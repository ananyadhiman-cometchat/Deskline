import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.js';
import { batchSyncUsers } from '../src/modules/cometchat/cometchat-sync.service.js';
import type { DesklineUserForSync } from '../src/modules/cometchat/cometchat-sync.service.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
});

/**
 * Batch-sync all seeded users to CometChat.
 * Logs results but does not throw — seed completes even if CometChat is unreachable.
 */
async function syncSeededUsersToCometChat(
  users: Array<{ id: string; name: string; role: string; department: string }>
): Promise<void> {
  try {
    const usersForSync: DesklineUserForSync[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role as DesklineUserForSync['role'],
      department: u.department as DesklineUserForSync['department'],
    }));

    const result = await batchSyncUsers(usersForSync);
    console.log(
      `[CometChat Seed Sync] Total: ${result.total}, Successful: ${result.successful}, Failed: ${result.failed}`
    );
  } catch (error) {
    console.warn('[CometChat Seed Sync] Batch sync failed (CometChat may be unavailable):', error);
  }
}

async function main() {
  await prisma.refreshToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword('Password123!');
  const departments = ['IT', 'HR', 'General'] as const;
  const statuses = ['open', 'in_progress', 'escalated', 'resolved', 'closed'] as const;
  const priorities = ['low', 'medium', 'high'] as const;
  const subTypes = ['information', 'action', 'conversation', 'escalation'] as const;

  const users = [] as any[];
  for (let i = 1; i <= 5; i++) users.push({ name: `Admin ${i}`, email: `admin${i}@deskline.local`, passwordHash, role: 'admin', department: 'General' });
  for (let i = 1; i <= 10; i++) users.push({ name: `Supervisor ${i}`, email: `supervisor${i}@deskline.local`, passwordHash, role: 'supervisor', department: departments[i % 3] });
  for (let i = 1; i <= 20; i++) users.push({ name: `Agent ${i}`, email: `agent${i}@deskline.local`, passwordHash, role: 'agent', department: departments[i % 3] });
  for (let i = 1; i <= 70; i++) users.push({ name: `Employee ${i}`, email: `employee${i}@deskline.local`, passwordHash, role: 'employee', department: departments[i % 3] });
  await prisma.user.createMany({ data: users });
  const allUsers = await prisma.user.findMany();

  // Batch-sync all seeded users to CometChat for initial data population.
  // This is non-blocking: if CometChat is unavailable, seed still completes.
  await syncSeededUsersToCometChat(allUsers);

  const employees = allUsers.filter(u => u.role === 'employee');
  const agents = allUsers.filter(u => u.role === 'agent' || u.role === 'supervisor');
  for (let i = 0; i < 60; i++) {
    const employee = employees[i % employees.length];
    const assigned = i < 50 ? agents[i % agents.length] : null;
    const ticket = await prisma.ticket.create({ data: { title: `Seed Ticket ${i + 1}`, description: `Generated ticket ${i + 1} for testing and demos.`, category: departments[i % 3], subType: subTypes[i % 4], priority: priorities[i % 3], status: statuses[i % 5], employeeId: employee.id, agentId: assigned?.id } });
    await prisma.activityLog.create({ data: { userId: employee.id, action: 'ticket_created', entityType: 'ticket', entityId: ticket.id, metadata: { seed: true } } });
    await prisma.activityLog.create({ data: { userId: assigned?.id ?? employee.id, action: 'status_updated', entityType: 'ticket', entityId: ticket.id, metadata: { status: ticket.status } } });
    await prisma.activityLog.create({ data: { userId: employee.id, action: 'notification_sent', entityType: 'notification', entityId: ticket.id, metadata: { seed: true } } });
    await prisma.notification.create({ data: { userId: employee.id, type: i % 4 === 0 ? 'assignment' : 'ticket_update', title: `Ticket ${i + 1}`, body: 'Seed notification', isRead: i % 2 === 0 } });
  }

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
