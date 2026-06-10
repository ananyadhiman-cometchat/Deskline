import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { authRouter } from './modules/auth/auth.route.js';
import { ticketsRouter } from './modules/tickets/tickets.route.js';
import { notificationsRouter } from './modules/notifications/notifications.route.js';
import { adminUsersRouter, userProfileRouter } from './modules/users/users.route.js';
import { healthRouter } from './routes/health.route.js';
import { adminRouter } from './modules/admin/admin.route.js';

export const app = express();

app.use(helmet());
app.use(cors());
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

app.use(errorHandler);
