import express, { NextFunction, Request, Response } from 'express';

import {
  BrowserManager,
  fetchAccuData,
  fetchAllData,
  fetchNWSData,
  fetchTWCData,
} from '../util/browser';
import { WeatherEntry, WeatherReport } from '../types/interfaces';
import { WeatherManager } from '../util/weather';
import { env } from '../util/env';
import { Log } from '../util/log';

const router = express.Router();

const devOnlyRoute = (req: Request, res: Response, next: NextFunction) => {
  if (env === 'prod') {
    Log.verbose(`Rejecting call to ${req.path} because env is prod`);
    res.status(404).send(`<pre>Cannot GET ${req.path}</pre>`);
    return;
  }
  next();
};

router.get('/weather', (_: Request, res: Response) => {
  const report: WeatherReport | undefined =
    WeatherManager.getInstance().getCurrentReport();
  if (!report) {
    // try to spin up report now if available
    if (BrowserManager.getInstance().getIsFetching()) {
      res
        .status(500)
        .json({
          message: 'No weather report available, fetch already in progress',
        });
    } else {
      fetchAllData();
      res
        .status(500)
        .json({ message: 'No weather report available, new fetch beginning' });
    }
    return;
  }
  res.json(report);
});

router.get('/twc', devOnlyRoute, async (_: Request, res: Response) => {
  const entries: WeatherEntry[] = await fetchTWCData();
  res.json(entries);
});

router.get('/accu', devOnlyRoute, async (_: Request, res: Response) => {
  const entries: WeatherEntry[] = await fetchAccuData();
  res.json(entries);
});

router.get('/nws', devOnlyRoute, async (_: Request, res: Response) => {
  const entries: WeatherEntry[] = await fetchNWSData();
  res.json(entries);
});

router.get('/all', devOnlyRoute, async (_: Request, res: Response) => {
  const entries: WeatherEntry[] = await fetchAllData();
  res.json(entries);
});

export { router };
