import { NotificationType, TicketStatus } from '../../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';

export function startTicketAutoCloseJob() {
  setInterval(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tickets = await prisma.ticket.findMany({
      where: {
        status: TicketStatus.resolved,
        resolutionConfirmationRequestedAt: {
          lte: cutoff
        }
      }
    });

    for (const ticket of tickets) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.closed,
          closedAt: new Date()
        }
      });

      await recordActivityLog({
        userId: ticket.employeeId,
        action: 'ticket_auto_closed',
        entityType: 'ticket',
        entityId: ticket.id,
        metadata: {}
      });

      await createNotification(prisma, {
        actorId: ticket.employeeId,
        userId: ticket.employeeId,
        type: NotificationType.ticket_update,
        title: 'Ticket Automatically Closed',
        body: `Ticket #${ticket.id} was automatically closed after 24 hours without a response.`,
        metadata: { ticketId: ticket.id }
      });
    }
  }, 60 * 60 * 1000);
}