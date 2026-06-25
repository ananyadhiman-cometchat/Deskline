import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { authRouter } from './modules/auth/auth.route.js';
import { ticketsRouter } from './modules/tickets/tickets.route.js';
import { notificationsRouter } from './modules/notifications/notifications.route.js';
import { adminUsersRouter, userProfileRouter } from './modules/users/users.route.js';
import { healthRouter } from './routes/health.route.js';
import { adminRouter } from './modules/admin/admin.route.js';
import { cometchatRouter } from './modules/cometchat/cometchat.route.js';
import { cometchatWebhookRouter } from './modules/cometchat/cometchat-webhook.route.js';
import { cometchatModerationRouter, cometchatWebhookAdminRouter } from './modules/cometchat/cometchat-moderation.route.js';

export const app = express();

// Behind ALB + nginx: trust private-network proxies so req.ip and req.protocol
// reflect the original client (via X-Forwarded-For / X-Forwarded-Proto).
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// CORS allowlist driven by env (comma-separated). Falls back to local dev origins.
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://localhost',
  'http://localhost:80'
];
const corsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

app.use(helmet());
app.use(cors({
  // TEMPORARY: allow all origins (reflects the request origin) so the
  // Cloudflare tunnel and any client can reach the API during demo/testing.
  // NOTE: a literal "*" cannot be used with credentials:true — browsers reject it.
  // Reflecting the origin achieves "allow all" while keeping cookies/auth working.
  // TODO: revert to the `corsOrigins` allowlist before production.
  origin: (origin, callback) => {
    // Allow same-origin / non-browser clients (mobile app, curl) which send no Origin header.
    if (!origin) return callback(null, true);
    // Reflect any origin back — effectively allow-all.
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(requestLogger);

app.get('/api', (_req, res) => {
  res.json({
    name: 'DeskLine API',
    version: 'v1',
    status: 'ok'
  });
});

app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', userProfileRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cometchat', cometchatRouter);
app.use('/webhooks/cometchat', cometchatWebhookRouter);
app.use('/api/admin/moderation', cometchatModerationRouter);
app.use('/api/admin/webhooks', cometchatWebhookAdminRouter);

app.use(errorHandler);
