import { Router, type Request, type Response } from 'express';
import type { WebhookEvent } from './cometchat.types.js';
import { validateSignature, processEvent } from './cometchat-webhook.service.js';

export const cometchatWebhookRouter = Router();

/**
 * POST /webhooks/cometchat
 *
 * Receives CometChat webhook events.
 * Authentication is via webhook signature (x-cometchat-signature header),
 * NOT via JWT. The raw body is validated against the signature.
 */
cometchatWebhookRouter.post(
  '/',
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-cometchat-signature'] as string | undefined;

      if (!signature) {
        res.status(401).json({ error: 'Missing webhook signature' });
        return;
      }

      // Get the raw body for signature validation.
      // The body has already been parsed by express.json(), so we reconstruct
      // the raw string for HMAC verification.
      const rawBody = JSON.stringify(req.body);

      if (!validateSignature(rawBody, signature)) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      const event = req.body as WebhookEvent;

      // Process the event asynchronously — respond immediately with 200
      // to avoid CometChat retrying due to timeout.
      // Errors are logged internally by processEvent.
      void processEvent(event).catch((err) => {
        console.error('[Webhook Route] Background processing error:', err);
      });

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Webhook Route] Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
