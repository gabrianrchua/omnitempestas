import morgan from 'morgan';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import 'dotenv/config';
import cors from 'cors';

import { port, env, frontendPort } from './util/env';
import { router as apiRoutes } from './routes/api';
import { WeatherUpdateScheduler } from './util/scheduler';
import { Log } from './util/log';
import { registerCleanup } from './util/cleanup';

const app = express();

app.use(
  morgan('combined', {
    stream: {
      write(message: string) {
        Log.info(message.trim());
      },
    },
  })
);
app.use(express.json());

// only use cors on development
if (env === 'dev') {
  app.use(cors());
}

app.use('/api', apiRoutes);

// proxy setup
if (env === 'dev') {
  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${frontendPort}`,
      changeOrigin: true,
    })
  );
} else if (env === 'prod') {
  app.use(express.static(__dirname + '/static'));
}

app.listen(port, () => {
  Log.info(`Server running in ${env} mode on http://localhost:${port}`);

  // only register weather update scheduler after app is done loading
  WeatherUpdateScheduler.getInstance();
});

// upon app exit, ensure clean up tasks are done
registerCleanup();

export default app;
