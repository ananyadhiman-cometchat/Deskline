import type { Request, Response } from 'express';
import { z } from 'zod';
import { createCommentSchema } from './comments.schemas.js';
import { listTicketComments, createTicketComment } from './comments.service.js';

export async function listCommentsController(req: Request, res: Response) {
  const { id: ticketId } = req.params;
  const actorId = req.user!.id;
  const actorRole = req.user!.role;

  const comments = await listTicketComments(actorId, actorRole, ticketId);
  res.json({ data: comments });
}

export async function createCommentController(req: Request, res: Response) {
  const { id: ticketId } = req.params;
  const actorId = req.user!.id;
  const actorRole = req.user!.role;

  const data = createCommentSchema.parse(req.body);

  const comment = await createTicketComment(actorId, actorRole, ticketId, data.body);
  res.status(201).json({ data: comment });
}
