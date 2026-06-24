import { Router, type Request, type Response } from 'express';
import { processWebhookPayload } from './cometchat-webhook.service.js';

export const cometchatWebhookRouter = Router();

/**
 * POST /webhooks/cometchat
 *
 * Receives CometChat webhook events (latest format — NOT legacy).
 *
 * CometChat's latest webhooks use Basic Authentication for security
 * (configured in the dashboard). The payload format is:
 * {
 *   "trigger": "message_sent" | "moderation_engine_blocked" | "call_ended" | ...,
 *   "data": { ... event-specific payload ... },
 *   "appId": "<appId>",
 *   "region": "<region>",
 *   "webhook": "<webhookID>"
 * }
 *
 * No HMAC signature header — security is via Basic Auth on the URL (dashboard config).
 */
cometchatWebhookRouter.post(
  '/',
  async (req: Request, res: Response) => {
    try {
      const body = req.body;

      if (!body || !body.trigger) {
        console.warn('[Webhook] Received payload with no trigger field:', JSON.stringify(body).slice(0, 200));
        res.status(400).json({ error: 'Invalid webhook payload: missing trigger' });
        return;
      }

      console.log(`[Webhook] Received trigger: ${body.trigger}`);

      // Process asynchronously — respond with 200 immediately per CometChat best practices.
      void processWebhookPayload(body).catch((err) => {
        console.error('[Webhook Route] Background processing error:', err);
      });

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Webhook Route] Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
