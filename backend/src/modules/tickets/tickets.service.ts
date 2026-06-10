import { Department, NotificationType, TicketStatus, TicketSubType, UserRole } from '../../../generated/prisma/client.js';
import type { Prisma, TicketCategory } from '../../../generated/prisma/client.js';

import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  isActive: true,
  lastLoginAt: true,
  lastFailedLoginAt: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

const ticketSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  subType: true,
  priority: true,
  status: true,
  employeeId: true,
  agentId: true,
  lastActivityAt: true,
  createdAt: true,
  updatedAt: true,
  employee: {
    select: safeUserSelect
  },
  agent: {
    select: safeUserSelect
  }
} satisfies Prisma.TicketSelect;

const activityLogSelect = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
  user: {
    select: safeUserSelect
  }
} satisfies Prisma.ActivityLogSelect;

const categoryToDepartment: Record<TicketCategory, Department> = {
  IT: Department.IT,
  HR: Department.HR,
  General: Department.General
};

type TicketActor = {
  id: string;
  role: UserRole;
  department: Department;
};

type TicketListFilters = {
  page: number;
  pageSize: number;
  status?: TicketStatus;
  subType?: TicketSubType;
  category?: TicketCategory;
};

type TicketUpdateInput = {
  status: TicketStatus;
  agentId?: string;
};

function isAssignableRole(role: UserRole) {
  return role === UserRole.agent || role === UserRole.supervisor;
}

function isClosedByAdminOnly(actor: TicketActor) {
  return actor.role === UserRole.admin;
}

async function findBestAssignee(role: UserRole.agent | UserRole.supervisor, category: TicketCategory) {
  const department = categoryToDepartment[category];

  const candidates = await prisma.user.findMany({
    where: {
      role,
      department,
      isActive: true
    },
    select: {
      ...safeUserSelect,
      _count: {
        select: {
          assignedTickets: {
            where: {
              status: TicketStatus.open
            }
          }
        }
      }
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = [...candidates].sort((left, right) => {
    const leftLoad = left._count.assignedTickets;
    const rightLoad = right._count.assignedTickets;

    if (leftLoad !== rightLoad) {
      return leftLoad - rightLoad;
    }

    const createdAtDelta = left.createdAt.getTime() - right.createdAt.getTime();

    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.id.localeCompare(right.id);
  });

  return sortedCandidates[0] ?? null;
}

async function appendActivityLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  await recordActivityLog({
    userId: actorId,
    action,
    entityType,
    entityId,
    metadata
  });
}

async function notifyTicketOwnerUpdate(input: {
  actorId: string;
  ticketId: string;
  recipientId: string;
  oldStatus: TicketStatus;
  newStatus: TicketStatus;
}) {
  return createNotification(prisma, {
    actorId: input.actorId,
    userId: input.recipientId,
    type: NotificationType.ticket_update,
    title: `Ticket #${input.ticketId} updated`,
    body: `Your ticket is now ${input.newStatus.replace('_', ' ')}.`,
    metadata: {
      ticketId: input.ticketId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus
    }
  });
}

async function notifyAssignment(input: {
  actorId: string;
  ticketId: string;
  recipientId: string;
  recipientType: NotificationType.assignment | NotificationType.escalation;
  title: string;
  body: string;
}) {
  return createNotification(prisma, {
    actorId: input.actorId,
    userId: input.recipientId,
    type: input.recipientType,
    title: input.title,
    body: input.body,
    metadata: {
      ticketId: input.ticketId
    }
  });
}

async function notifyDepartmentSupervisors(input: {
  actorId: string;
  ticketId: string;
  department: Department;
  title: string;
  body: string;
}) {
  const supervisors = await prisma.user.findMany({
    where: {
      role: UserRole.supervisor,
      department: input.department,
      isActive: true
    },
    select: { id: true }
  });

  await Promise.all(
    supervisors.map((supervisor) =>
      createNotification(prisma, {
        actorId: input.actorId,
        userId: supervisor.id,
        type: NotificationType.assignment,
        title: input.title,
        body: input.body,
        metadata: {
          ticketId: input.ticketId,
          department: input.department
        }
      })
    )
  );
}

async function createTicketWithRouting(input: {
  actorId: string;
  title: string;
  description: string;
  category: TicketCategory;
  subType: TicketSubType;
  priority: 'low' | 'medium' | 'high';
}) {
  const department = categoryToDepartment[input.category];

  let assignee: { id: string; role: UserRole } | null = null;

  if (input.subType === TicketSubType.escalation) {
    assignee = await findBestAssignee(UserRole.supervisor, input.category);
  } else if (input.subType === TicketSubType.action || input.subType === TicketSubType.conversation) {
    assignee = await findBestAssignee(UserRole.agent, input.category);
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      subType: input.subType,
      priority: input.priority,
      status: TicketStatus.open,
      employeeId: input.actorId,
      ...(assignee ? { agentId: assignee.id } : {})
    },
    select: ticketSelect
  });

  await appendActivityLog(input.actorId, 'ticket_created', 'ticket', ticket.id, {
    category: input.category,
    subType: input.subType,
    priority: input.priority,
    assignedAgentId: assignee?.id ?? null
  });

  if (input.subType === TicketSubType.information) {
    await appendActivityLog(input.actorId, 'ai_reply_sent', 'ticket', ticket.id, {
      category: input.category,
      reason: input.subType
    });

    await createNotification(prisma, {
      actorId: input.actorId,
      userId: input.actorId,
      type: NotificationType.ticket_update,
      title: `AI reply for ticket #${ticket.id}`,
      body: `An AI assistant replied to your ${input.category} ticket.`,
      metadata: {
        ticketId: ticket.id,
        subType: input.subType
      }
    });

    return ticket;
  }

  if (assignee) {
    const notificationType = assignee.role === UserRole.supervisor ? NotificationType.escalation : NotificationType.assignment;

    await appendActivityLog(input.actorId, 'ticket_assigned', 'ticket', ticket.id, {
      assignedToId: assignee.id,
      assignedToRole: assignee.role,
      department
    });

    await notifyAssignment({
      actorId: input.actorId,
      ticketId: ticket.id,
      recipientId: assignee.id,
      recipientType: notificationType,
      title: `New ticket assigned: ${ticket.title}`,
      body: `Ticket #${ticket.id} needs attention.`
    });

    return ticket;
  }

  await notifyDepartmentSupervisors({
    actorId: input.actorId,
    ticketId: ticket.id,
    department,
    title: `Unassigned ticket in ${department}`,
    body: `Ticket #${ticket.id} is waiting for assignment.`
  });

  return ticket;
}

function assertCanViewTicket(actor: TicketActor, ticket: { employeeId: string; agentId: string | null }) {
  if (actor.role === UserRole.admin || actor.role === UserRole.supervisor) {
    return;
  }

  if (actor.role === UserRole.employee && ticket.employeeId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (actor.role === UserRole.agent && ticket.agentId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }
}

function assertTransitionAllowed(actor: TicketActor, currentStatus: TicketStatus, nextStatus: TicketStatus) {
  const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
    open: [TicketStatus.in_progress],
    in_progress: [TicketStatus.escalated, TicketStatus.resolved],
    escalated: [TicketStatus.resolved],
    resolved: [TicketStatus.closed],
    closed: []
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError('Invalid ticket status transition', 400, 'INVALID_TICKET_STATUS_TRANSITION');
  }

  if (nextStatus === TicketStatus.closed && !isClosedByAdminOnly(actor)) {
    throw new AppError('Only admins can close tickets', 403, 'FORBIDDEN');
  }
}

async function loadTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketSelect
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  return ticket;
}

async function loadTicketDetails(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: ticketSelect
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404, 'TICKET_NOT_FOUND');
  }

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      entityType: 'ticket',
      entityId: ticketId
    },
    orderBy: { createdAt: 'asc' },
    select: activityLogSelect
  });

  return {
    ...ticket,
    activityLogs
  };
}

function buildTicketWhere(actor: TicketActor, filters: TicketListFilters): Prisma.TicketWhereInput {
  const accessFilter: Prisma.TicketWhereInput =
    actor.role === UserRole.employee
      ? { employeeId: actor.id }
      : actor.role === UserRole.agent
        ? { agentId: actor.id }
        : {};

  return {
    ...accessFilter,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.subType ? { subType: filters.subType } : {}),
    ...(filters.category ? { category: filters.category } : {})
  };
}

function isAssigneeUpdateAllowed(actor: TicketActor) {
  return actor.role === UserRole.supervisor || actor.role === UserRole.admin;
}

async function updateTicketAssignee(actor: TicketActor, ticketId: string, agentId: string) {
  if (!isAssigneeUpdateAllowed(actor)) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const ticket = await loadTicket(ticketId);

  const assignee = await prisma.user.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      role: true,
      department: true,
      isActive: true
    }
  });

  if (!assignee || !assignee.isActive || !isAssignableRole(assignee.role)) {
    throw new AppError('Assigned user not found', 404, 'ASSIGNED_USER_NOT_FOUND');
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      agentId
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'ticket_assigned', 'ticket', ticket.id, {
    previousAgentId: ticket.agentId,
    assignedToId: agentId,
    assignedToRole: assignee.role,
    category: ticket.category
  });

  await createNotification(prisma, {
    actorId: actor.id,
    userId: agentId,
    type: NotificationType.assignment,
    title: `Ticket assigned: ${ticket.title}`,
    body: `You have been assigned ticket #${ticket.id}.`,
    metadata: {
      ticketId: ticket.id,
      previousAgentId: ticket.agentId
    }
  });

  return updatedTicket;
}

async function escalateTicketInternal(actor: TicketActor, ticketId: string) {
  if (actor.role !== UserRole.agent && actor.role !== UserRole.supervisor) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const ticket = await loadTicket(ticketId);

  if (ticket.status === TicketStatus.closed || ticket.status === TicketStatus.resolved) {
    throw new AppError('Ticket cannot be escalated from its current state', 409, 'TICKET_NOT_ESCALATABLE');
  }

  if (ticket.status === TicketStatus.open && actor.role === UserRole.agent) {
    throw new AppError('Ticket must be in progress before escalation', 409, 'TICKET_NOT_ESCALATABLE');
  }

  const supervisor = await findBestAssignee(UserRole.supervisor, ticket.category);

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.escalated,
      ...(supervisor ? { agentId: supervisor.id } : {})
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'ticket_escalated', 'ticket', ticket.id, {
    fromAgentId: ticket.agentId,
    toSupervisorId: supervisor?.id ?? null,
    category: ticket.category
  });

  await appendActivityLog(actor.id, 'status_updated', 'ticket', ticket.id, {
    oldStatus: ticket.status,
    newStatus: TicketStatus.escalated,
    agentId: supervisor?.id ?? ticket.agentId
  });

  if (supervisor) {
    await appendActivityLog(actor.id, 'ticket_assigned', 'ticket', ticket.id, {
      previousAgentId: ticket.agentId,
      assignedToId: supervisor.id,
      assignedToRole: supervisor.role,
      category: ticket.category
    });

    await notifyAssignment({
      actorId: actor.id,
      ticketId: ticket.id,
      recipientId: supervisor.id,
      recipientType: NotificationType.escalation,
      title: `Escalated ticket assigned: ${ticket.title}`,
      body: `Ticket #${ticket.id} has been escalated to you.`
    });
  }

  await notifyTicketOwnerUpdate({
    actorId: actor.id,
    ticketId: ticket.id,
    recipientId: ticket.employeeId,
    oldStatus: ticket.status,
    newStatus: TicketStatus.escalated
  });

  return updatedTicket;
}

async function updateTicketStatus(actor: TicketActor, ticketId: string, status: TicketStatus) {
  const ticket = await loadTicket(ticketId);

  assertTransitionAllowed(actor, ticket.status, status);

  if (status === TicketStatus.escalated) {
    return escalateTicketInternal(actor, ticketId);
  }

  if (status === TicketStatus.in_progress && actor.role === UserRole.agent && ticket.agentId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (status === TicketStatus.resolved && actor.role === UserRole.agent && ticket.agentId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      lastActivityAt: new Date()
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'status_updated', 'ticket', ticket.id, {
    oldStatus: ticket.status,
    newStatus: status,
    agentId: ticket.agentId
  });

  if (status === TicketStatus.resolved) {
    await appendActivityLog(actor.id, 'ticket_resolved', 'ticket', ticket.id, {
      oldStatus: ticket.status,
      newStatus: status,
      agentId: ticket.agentId
    });
  }

  if (status === TicketStatus.in_progress && ticket.status === TicketStatus.open && actor.role === UserRole.agent) {
    await appendActivityLog(actor.id, 'ticket_claimed', 'ticket', ticket.id, {
      agentId: actor.id,
      category: ticket.category
    });
  }

  await notifyTicketOwnerUpdate({
    actorId: actor.id,
    ticketId: ticket.id,
    recipientId: ticket.employeeId,
    oldStatus: ticket.status,
    newStatus: status
  });

  return updatedTicket;
}

export async function createTicket(actor: TicketActor, input: {
  title: string;
  description: string;
  category: TicketCategory;
  subType: TicketSubType;
  priority: 'low' | 'medium' | 'high';
}) {
  if (actor.role !== UserRole.employee) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  return createTicketWithRouting({
    actorId: actor.id,
    ...input
  });
}

export async function listTickets(actor: TicketActor, filters: TicketListFilters) {
  const where = buildTicketWhere(actor, filters);

  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: ticketSelect
    }),
    prisma.ticket.count({ where })
  ]);

  return {
    items,
    meta: {
      total,
      page: filters.page,
      pageSize: filters.pageSize
    }
  };
}

export async function getTicket(actor: TicketActor, ticketId: string) {
  const ticket = await loadTicket(ticketId);

  assertCanViewTicket(actor, ticket);

  return loadTicketDetails(ticketId);
}

export async function updateTicket(actor: TicketActor, ticketId: string, input: TicketUpdateInput) {
  if (input.agentId) {
    return updateTicketAssignee(actor, ticketId, input.agentId);
  }

  return updateTicketStatus(actor, ticketId, input.status);
}

export async function escalateTicket(actor: TicketActor, ticketId: string) {
  return escalateTicketInternal(actor, ticketId);
}
