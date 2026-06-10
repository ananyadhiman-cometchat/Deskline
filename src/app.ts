import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { healthRouter } from './routes/health.route.js';

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

app.use('/api/health', healthRouter);

app.use(errorHandler);
