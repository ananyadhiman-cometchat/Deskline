import { Department, NotificationType, TicketStatus, TicketSubType, UserRole } from '../../../generated/prisma/client.js';
import type { Prisma, TicketCategory } from '../../../generated/prisma/client.js';

import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { recordActivityLog } from '../activity-logs/activity-logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';
import { createTicketConversation, createEscalationGroup, addMemberToTicketGroup } from '../cometchat/cometchat-chat.service.js';
import { createAIAgentConversation, handleHumanHelpRequest } from '../cometchat/cometchat-ai.service.js';
import { onTicketStatusChange } from '../cometchat/cometchat-lifecycle.service.js';

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
  cometchatConvoId: true,
  lastActivityAt: true,
  resolvedAt: true,
  resolutionConfirmationRequestedAt: true,
  closedAt: true,
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
  agentId?: string;
};

type TicketUpdateInput = {
  status: TicketStatus;
  agentId?: string;
};

function isAssignableRole(role: UserRole) {
  return role === UserRole.agent || role === UserRole.supervisor;
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
              status: { in: [TicketStatus.open, TicketStatus.in_progress] }
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
  ticketTitle: string;
  recipientId: string;
  oldStatus: TicketStatus;
  newStatus: TicketStatus;
}) {
  const statusLabel = input.newStatus.replace('_', ' ');
  try {
    return await createNotification(prisma, {
      actorId: input.actorId,
      userId: input.recipientId,
      type: NotificationType.ticket_update,
      title: `"${input.ticketTitle}" updated`,
      body: `Your ticket is now ${statusLabel}.`,
      metadata: {
        ticketId: input.ticketId,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus
      }
    });
  } catch (error) {
    console.error('Non-fatal: notifyTicketOwnerUpdate failed:', (error as Error)?.message);
    return null;
  }
}

async function notifyAssignment(input: {
  actorId: string;
  ticketId: string;
  recipientId: string;
  recipientType: NotificationType.assignment | NotificationType.escalation;
  title: string;
  body: string;
}) {
  try {
    return await createNotification(prisma, {
      actorId: input.actorId,
      userId: input.recipientId,
      type: input.recipientType,
      title: input.title,
      body: input.body,
      metadata: {
        ticketId: input.ticketId
      }
    });
  } catch (error) {
    console.error('Non-fatal: notifyAssignment failed:', (error as Error)?.message);
    return null;
  }
}

async function notifyDepartmentSupervisors(input: {
  actorId: string;
  ticketId: string;
  department: Department;
  title: string;
  body: string;
}) {
  try {
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
        }).catch((err) => {
          console.error('Non-fatal: supervisor notification failed:', (err as Error)?.message);
          return null;
        })
      )
    );
  } catch (error) {
    console.error('Non-fatal: notifyDepartmentSupervisors failed:', (error as Error)?.message);
  }
}

import { generateTicketResponse } from '../ai/ai.service.js';

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
    // Generate actual AI response
    const aiResponse = await generateTicketResponse(input.title, input.description);

    // Save it as a comment
    await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        userId: input.actorId, // Assigning to actorId, though it's technically from AI
        body: aiResponse,
        isAi: true
      }
    });

    await appendActivityLog(input.actorId, 'ai_reply_sent', 'ticket', ticket.id, {
      category: input.category,
      reason: input.subType
    });

    await createNotification(prisma, {
      actorId: input.actorId,
      userId: input.actorId,
      type: NotificationType.ticket_update,
      title: `AI reply for "${ticket.title}"`,
      body: `An AI assistant replied to your ${input.category} ticket.`,
      metadata: {
        ticketId: ticket.id,
        subType: input.subType
      }
    });

    // Create CometChat AI Agent conversation (non-blocking)
    createAIAgentConversation(ticket.id, input.actorId).catch((err) => {
      console.error('[Tickets] Non-blocking: AI conversation creation failed:', (err as Error)?.message);
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
      body: `A new ${input.category} ticket needs your attention.`
    });

    return ticket;
  }

  await notifyDepartmentSupervisors({
    actorId: input.actorId,
    ticketId: ticket.id,
    department,
    title: `Unassigned ticket in ${department}`,
    body: `"${ticket.title}" is waiting for assignment.`
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
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.subType ? { subType: filters.subType } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.agentId ? { agentId: filters.agentId } : {}),
    ...accessFilter
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

  if (ticket.agentId === agentId) {
    return ticket;
  }

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
    body: `You have been assigned to "${ticket.title}".`,
    metadata: {
      ticketId: ticket.id,
      previousAgentId: ticket.agentId
    }
  });

  return updatedTicket;
}

async function escalateTicketInternal(actor: TicketActor, ticketId: string) {
  if (
    actor.role !== UserRole.agent &&
    actor.role !== UserRole.supervisor &&
    actor.role !== UserRole.admin
  ) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const ticket = await loadTicket(ticketId);

  if (ticket.status === TicketStatus.escalated) {
    return ticket;
  }

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
      body: `"${ticket.title}" has been escalated to you.`
    });
  }

  await notifyTicketOwnerUpdate({
    actorId: actor.id,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
    recipientId: ticket.employeeId,
    oldStatus: ticket.status,
    newStatus: TicketStatus.escalated
  });

  // Create CometChat escalation group (non-blocking)
  // Include the original agent if one was assigned before escalation
  const escalationSupervisorUid = supervisor?.id ?? ticket.agentId;
  if (escalationSupervisorUid) {
    createEscalationGroup(
      ticket.id,
      ticket.employeeId,
      escalationSupervisorUid,
      supervisor ? (ticket.agentId ?? undefined) : undefined
    ).catch((err) => {
      console.error('[Tickets] Non-blocking: Escalation group creation failed:', (err as Error)?.message);
    });
  }

  // Sync chat lifecycle with escalation status change (non-blocking)
  onTicketStatusChange(ticketId, ticket.status, TicketStatus.escalated).catch((err) => {
    console.error('[Tickets] Non-blocking: Chat lifecycle sync on escalation failed:', (err as Error)?.message);
  });

  return updatedTicket;
}

async function updateTicketStatus(actor: TicketActor, ticketId: string, status: TicketStatus) {
  const ticket = await loadTicket(ticketId);

  if (ticket.status === status) {
    return ticket;
  }

  if (
    ticket.status === TicketStatus.escalated &&
    actor.role === UserRole.agent
  ) {
    throw new AppError(
      'Escalated tickets can only be updated by the assigned supervisor or admin',
      403,
      'ESCALATED_TICKET_SUPERVISOR_REQUIRED'
    );
  }

  if (
    ticket.status === TicketStatus.escalated &&
    actor.role === UserRole.supervisor &&
    ticket.agentId !== actor.id
  ) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

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

  const now = new Date();
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      lastActivityAt: now,
      ...(status === TicketStatus.resolved
        ? {
            resolvedAt: now,
            resolutionConfirmationRequestedAt: now
          }
        : {})
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

    await createNotification(prisma, {
      actorId: actor.id,
      userId: ticket.employeeId,
      type: NotificationType.ticket_update,
      title: 'Resolution Confirmation Required',
      body: 'Your ticket has been marked as resolved. Please confirm whether your issue has been resolved.',
      metadata: {
        ticketId: ticket.id,
        resolvedAt: updatedTicket.resolvedAt,
        resolutionConfirmationRequestedAt: updatedTicket.resolutionConfirmationRequestedAt
      }
    });
  }

  if (status === TicketStatus.in_progress && ticket.status === TicketStatus.open) {
    if (actor.role === UserRole.agent) {
      await appendActivityLog(actor.id, 'ticket_claimed', 'ticket', ticket.id, {
        agentId: actor.id,
        category: ticket.category
      });
    }

    // Create CometChat 1:1 conversation when ticket moves to in_progress (non-blocking)
    if (ticket.subType === TicketSubType.conversation && ticket.agentId) {
      createTicketConversation(ticket.id, ticket.employeeId, ticket.agentId).catch((err) => {
        console.error('[Tickets] Non-blocking: Chat creation on claim failed:', (err as Error)?.message);
      });
    }
  }

  // Sync chat lifecycle with ticket status change (non-blocking)
  onTicketStatusChange(ticketId, ticket.status, status).catch((err) => {
    console.error('[Tickets] Non-blocking: Chat lifecycle sync failed:', (err as Error)?.message);
  });

  await notifyTicketOwnerUpdate({
    actorId: actor.id,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
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
  let ticket = await loadTicket(ticketId);

  if (input.agentId && input.agentId !== ticket.agentId) {
    ticket = await updateTicketAssignee(actor, ticketId, input.agentId);
  }

  if (input.status && input.status !== ticket.status) {
    ticket = await updateTicketStatus(actor, ticketId, input.status);
  }

  return ticket;
}

export async function escalateTicket(actor: TicketActor, ticketId: string) {
  return escalateTicketInternal(actor, ticketId);
}

export async function requestHumanHelp(actor: TicketActor, ticketId: string) {
  if (actor.role !== UserRole.employee) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const ticket = await loadTicket(ticketId);

  if (ticket.employeeId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (ticket.subType !== TicketSubType.information) {
    throw new AppError('Human help can only be requested for information tickets', 400, 'INVALID_TICKET_TYPE');
  }

  const assignee = await findBestAssignee(UserRole.agent, ticket.category);

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      agentId: assignee?.id ?? null,
      status: TicketStatus.in_progress,
      lastActivityAt: new Date()
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'human_help_requested', 'ticket', ticket.id, {
    assignedAgentId: assignee?.id ?? null
  });

  // Trigger AI-to-human handoff in CometChat (non-blocking)
  // This sends a closing message from the AI Agent; the conversation history remains accessible.
  handleHumanHelpRequest(ticket.id).catch((err) => {
    console.error('[Tickets] Non-blocking: AI-to-human handoff failed:', (err as Error)?.message);
  });

  // Add the human agent to the existing AI group conversation (non-blocking)
  // This preserves the conversation history — no new conversation is created.
  if (assignee) {
    addMemberToTicketGroup(ticket.id, assignee.id, 'admin').catch((err) => {
      console.error('[Tickets] Non-blocking: Adding agent to AI group failed:', (err as Error)?.message);
    });
  }

  if (assignee) {
    await notifyAssignment({
      actorId: actor.id,
      ticketId: ticket.id,
      recipientId: assignee.id,
      recipientType: NotificationType.assignment,
      title: `Human help requested: ${ticket.title}`,
      body: `An employee requested human assistance for "${ticket.title}". AI conversation history is available for review on the ticket.`
    });
  }

  return updatedTicket;
}

export async function confirmResolution(actor: TicketActor, ticketId: string) {
  const ticket = await loadTicket(ticketId);

  if (actor.role !== UserRole.employee || ticket.employeeId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (ticket.status !== TicketStatus.resolved) {
    throw new AppError('Ticket must be resolved first', 409, 'INVALID_TICKET_STATE');
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.closed,
      lastActivityAt: new Date(),
      closedAt: new Date()
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'resolution_confirmed', 'ticket', ticketId, {});

  await createNotification(prisma, {
    actorId: actor.id,
    userId: ticket.employeeId,
    type: NotificationType.ticket_update,
    title: 'Ticket Closed',
    body: `"${ticket.title}" has been closed after your confirmation.`,
    metadata: { ticketId: ticket.id }
  });

  if (ticket.agentId) {
    await createNotification(prisma, {
      actorId: actor.id,
      userId: ticket.agentId,
      type: NotificationType.ticket_update,
      title: 'Resolution Accepted',
      body: `The employee accepted your resolution for "${ticket.title}".`,
      metadata: { ticketId: ticket.id }
    });
  }

  return updatedTicket;
}

export async function rejectResolution(actor: TicketActor, ticketId: string) {
  const ticket = await loadTicket(ticketId);

  if (actor.role !== UserRole.employee || ticket.employeeId !== actor.id) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  if (ticket.status !== TicketStatus.resolved) {
    throw new AppError('Ticket must be resolved first', 409, 'INVALID_TICKET_STATE');
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: ticket.agentId ? TicketStatus.in_progress : TicketStatus.open,
      lastActivityAt: new Date(),
      resolvedAt: null,
      resolutionConfirmationRequestedAt: null
    },
    select: ticketSelect
  });

  await appendActivityLog(actor.id, 'resolution_rejected', 'ticket', ticketId, {});
  await appendActivityLog(actor.id, 'ticket_reopened', 'ticket', ticketId, {});

  if (ticket.agentId) {
    await createNotification(prisma, {
      actorId: actor.id,
      userId: ticket.agentId,
      type: NotificationType.ticket_update,
      title: 'Ticket Reopened',
      body: `The employee rejected your resolution for "${ticket.title}".`,
      metadata: {
        ticketId: ticket.id,
        status: updatedTicket.status
      }
    });
  }

  return updatedTicket;
}

export async function interceptTicketConversation(actor: TicketActor, ticketId: string) {
  if (actor.role !== UserRole.admin && actor.role !== UserRole.supervisor) {
    throw new AppError('Forbidden — only admins and supervisors can intercept conversations', 403, 'FORBIDDEN');
  }

  const ticket = await loadTicket(ticketId);

  if (!ticket.cometchatConvoId) {
    throw new AppError('No active conversation on this ticket', 400, 'NO_CONVERSATION');
  }

  if (ticket.agentId === actor.id || ticket.employeeId === actor.id) {
    throw new AppError('User is already part of this ticket conversation', 400, 'ALREADY_JOINED');
  }

  // Add the actor to the ticket's group conversation
  await addMemberToTicketGroup(ticketId, actor.id, 'admin');

  await appendActivityLog(actor.id, 'conversation_intercepted', 'ticket', ticketId, {
    interceptedBy: actor.id,
    role: actor.role,
  });

  return ticket;
}
