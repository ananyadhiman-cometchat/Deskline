import { Router } from 'express';
import type { Request, Response } from 'express';

import { authenticateRequest, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { AppError } from '../../lib/errors.js';
import { listFlagged, dismissItem, blockSender } from './cometchat-moderation.service.js';
import { retryEvent } from './cometchat-webhook.service.js';

export const cometchatModerationRouter = Router();

// All moderation routes require JWT auth + admin role
cometchatModerationRouter.use(authenticateRequest);
cometchatModerationRouter.use(requireRole('admin'));

/**
 * GET /api/admin/moderation
 *
 * List flagged messages in the moderation queue (pending items).
 * Supports pagination via ?page=&limit= query params.
 */
cometchatModerationRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await listFlagged({ page, limit });

    res.json(result);
  })
);

/**
 * POST /api/admin/moderation/:id/action
 *
 * Take action on a flagged moderation queue item.
 * Body: { action: "dismiss" | "block" }
 */
cometchatModerationRouter.post(
  '/:id/action',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { action } = req.body;

    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }

    if (!action || !['dismiss', 'block'].includes(action)) {
      throw new AppError('Invalid action. Must be "dismiss" or "block"', 400, 'INVALID_ACTION');
    }

    let item;
    if (action === 'dismiss') {
      item = await dismissItem(id, req.user.id);
    } else {
      item = await blockSender(id, req.user.id);
    }

    res.json({ success: true, item });
  })
);

// ─── Webhook Admin Router ────────────────────────────────────────────────────

export const cometchatWebhookAdminRouter = Router();

// Webhook admin routes also require JWT auth + admin role
cometchatWebhookAdminRouter.use(authenticateRequest);
cometchatWebhookAdminRouter.use(requireRole('admin'));

/**
 * POST /api/admin/webhooks/:id/retry
 *
 * Retry a failed webhook event by its ID.
 */
cometchatWebhookAdminRouter.post(
  '/:id/retry',
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await retryEvent(id);

    res.json({ success: true, message: `Webhook event ${id} retried successfully` });
  })
);
