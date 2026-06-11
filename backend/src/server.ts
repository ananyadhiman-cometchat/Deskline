import { app } from './app.js';
import { env } from './config/env.js';
import { startTicketAutoCloseJob } from './modules/tickets/ticket-auto-close.job.js';

startTicketAutoCloseJob();

app.listen(env.PORT, () => {
  console.log(`DeskLine API listening on port ${env.PORT}`);
});
