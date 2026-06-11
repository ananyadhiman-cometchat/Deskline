import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

async function main() {
  console.log('Cleaning up existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await hashPassword('Password123!');
  const departments = ['IT', 'HR', 'General'] as const;
  const statuses = ['open', 'in_progress', 'escalated', 'resolved', 'closed'] as const;
  const priorities = ['low', 'medium', 'high'] as const;
  const subTypes = ['information', 'action', 'conversation', 'escalation'] as const;

  const users = [] as any[];
  for (let i = 1; i <= 5; i++) {
    users.push({ name: `Admin ${i}`, email: `admin${i}@deskline.local`, passwordHash, role: 'admin', department: 'General', fcmToken: `dummy-fcm-admin-${i}` });
  }
  for (let i = 1; i <= 10; i++) {
    users.push({ name: `Supervisor ${i}`, email: `supervisor${i}@deskline.local`, passwordHash, role: 'supervisor', department: departments[i % 3], fcmToken: `dummy-fcm-supervisor-${i}` });
  }
  for (let i = 1; i <= 20; i++) {
    users.push({ name: `Agent ${i}`, email: `agent${i}@deskline.local`, passwordHash, role: 'agent', department: departments[i % 3], fcmToken: `dummy-fcm-agent-${i}` });
  }
  for (let i = 1; i <= 65; i++) {
    users.push({ name: `Employee ${i}`, email: `employee${i}@deskline.local`, passwordHash, role: 'employee', department: departments[i % 3], fcmToken: `dummy-fcm-employee-${i}` });
  }
  await prisma.user.createMany({ data: users });

  const allUsers = await prisma.user.findMany();
  const employees = allUsers.filter(u => u.role === 'employee');
  const agents = allUsers.filter(u => u.role === 'agent');
  const supervisors = allUsers.filter(u => u.role === 'supervisor');

  console.log('Seeding refresh tokens...');
  const tokens = allUsers.map(user => ({
    userId: user.id,
    tokenHash: `dummy-token-${user.id}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }));
  await prisma.refreshToken.createMany({ data: tokens });

  console.log('Seeding tickets, logs, and comments...');
  for (let i = 0; i < 60; i++) {
    const employee = employees[i % employees.length];
    
    const subType = subTypes[i % 4];
    const category = departments[i % 3];
    const status = statuses[i % 5];
    const priority = priorities[i % 3];
    
    // User requested ALL tickets must be assigned.
    let assigned = agents[i % agents.length];
    if (subType === 'escalation' || status === 'escalated') {
      assigned = supervisors[i % supervisors.length];
    }
    
    const ticket = await prisma.ticket.create({
      data: {
        title: `Seed Ticket ${i + 1}`,
        description: `Generated ticket ${i + 1} for testing and demos. This ticket belongs to category ${category}.`,
        category,
        subType,
        priority,
        status,
        employeeId: employee.id,
        agentId: assigned.id,
        lastActivityAt: new Date()
      }
    });

    // 3 Realistic Activity Logs per ticket
    await prisma.activityLog.create({
      data: { userId: employee.id, action: 'ticket_created', entityType: 'ticket', entityId: ticket.id, metadata: { category, subType, priority } }
    });
    await prisma.activityLog.create({
      data: { userId: assigned.id, action: 'ticket_assigned', entityType: 'ticket', entityId: ticket.id, metadata: { assignedToId: assigned.id } }
    });
    await prisma.activityLog.create({
      data: { userId: assigned.id, action: 'status_updated', entityType: 'ticket', entityId: ticket.id, metadata: { oldStatus: 'open', newStatus: ticket.status } }
    });

    // Notification record
    await prisma.notification.create({
      data: { userId: assigned.id, type: 'assignment', title: `Ticket Assigned: ${ticket.title}`, body: 'You have been assigned a seed ticket.', isRead: i % 2 === 0 }
    });

    // TicketComments
    if (subType === 'information') {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: employee.id,
          body: "**[Automated AI Response - Mock Mode]**\n\nHere is an automated response to your seed query regarding the information request.",
          isAi: true
        }
      });
      await prisma.activityLog.create({
        data: { userId: employee.id, action: 'ai_reply_sent', entityType: 'ticket', entityId: ticket.id, metadata: { reason: subType } }
      });
    } else {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: employee.id,
          body: "Hello, I need help with this seed issue. Please look into it as soon as possible.",
          isAi: false
        }
      });
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: assigned.id,
          body: "Hello! We are currently looking into this seed issue for you and will update you shortly.",
          isAi: false
        }
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
