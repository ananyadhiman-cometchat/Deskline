import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../../lib/errors.js';
import { ticketCreateSchema, ticketListQuerySchema, ticketUpdateSchema } from './tickets.schemas.js';
import { createTicket, escalateTicket, getTicket, listTickets, requestHumanHelp, updateTicket, confirmResolution, rejectResolution } from './tickets.service.js';

function parseBody<T>(schema: { parse: (value: unknown) => T }, body: unknown) {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(error.issues[0]?.message ?? 'Invalid request', 400, 'INVALID_REQUEST');
    }

    throw error;
  }
}

export async function createTicketController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const payload = parseBody(ticketCreateSchema, request.body);
  const ticket = await createTicket(request.user, payload);

  response.status(201).json({ data: ticket });
}

export async function listTicketsController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const query = parseBody(ticketListQuerySchema, request.query);
  const result = await listTickets(request.user, query);

  response.json({
    data: result.items,
    meta: result.meta
  });
}

export async function getTicketController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const ticket = await getTicket(request.user, request.params.id);

  response.json({ data: ticket });
}

export async function updateTicketController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const payload = parseBody(ticketUpdateSchema, request.body);
  const ticket = await updateTicket(request.user, request.params.id, payload);

  response.json({ data: ticket });
}

export async function escalateTicketController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const ticket = await escalateTicket(request.user, request.params.id);

  response.json({ data: ticket });
}

export async function requestHumanHelpController(request: Request, response: Response) {
  if (!request.user) {
    throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  }

  const ticket = await requestHumanHelp(request.user, request.params.id);

  response.json({ data: ticket });
}

export async function confirmResolutionController(request: Request, response: Response) {
  if (!request.user) throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  response.json({ data: await confirmResolution(request.user, request.params.id) });
}

export async function rejectResolutionController(request: Request, response: Response) {
  if (!request.user) throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
  response.json({ data: await rejectResolution(request.user, request.params.id) });
}