import { NotificationType, UserRole } from '../../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { createNotification } from '../notifications/notifications.service.js';

export async function listTicketComments(actorId: string, actorRole: UserRole, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  if (actorRole === UserRole.employee && ticket.employeeId !== actorId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (actorRole === UserRole.agent && ticket.agentId !== actorId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const comments = await prisma.ticketComment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  return comments;
}

export async function createTicketComment(actorId: string, actorRole: UserRole, ticketId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  if (actorRole === UserRole.employee && ticket.employeeId !== actorId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (actorRole === UserRole.agent && ticket.agentId !== actorId) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: actorId,
      body,
      isAi: false
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  // Notifications
  if (actorRole === UserRole.employee && ticket.agentId) {
    await createNotification(prisma, {
      actorId,
      userId: ticket.agentId,
      type: NotificationType.ticket_update,
      title: `New reply on Ticket #${ticket.id.slice(0, 8)}`,
      body: `Employee added a new comment.`,
      metadata: { ticketId }
    });
  } else if ((actorRole === UserRole.agent || actorRole === UserRole.supervisor || actorRole === UserRole.admin) && ticket.employeeId !== actorId) {
    await createNotification(prisma, {
      actorId,
      userId: ticket.employeeId,
      type: NotificationType.ticket_update,
      title: `Agent replied to Ticket #${ticket.id.slice(0, 8)}`,
      body: `An agent added a new comment.`,
      metadata: { ticketId }
    });
  }

  // Update lastActivityAt on ticket
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { lastActivityAt: new Date() }
  });

  return comment;
}
