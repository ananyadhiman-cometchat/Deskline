import { Router } from 'express';

import { authenticateRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import {
  createTicketController,
  escalateTicketController,
  getTicketController,
  requestHumanHelpController,
  listTicketsController,
  updateTicketController
} from './tickets.controller.js';

export const ticketsRouter = Router();

ticketsRouter.use(authenticateRequest);
ticketsRouter.post('/', asyncHandler(createTicketController));
ticketsRouter.get('/', asyncHandler(listTicketsController));
ticketsRouter.get('/:id', asyncHandler(getTicketController));
ticketsRouter.patch('/:id', asyncHandler(updateTicketController));
ticketsRouter.post('/:id/request-human-help', asyncHandler(requestHumanHelpController));
ticketsRouter.post('/:id/escalate', asyncHandler(escalateTicketController));