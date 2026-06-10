import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`DeskLine API listening on port ${env.PORT}`);
});
