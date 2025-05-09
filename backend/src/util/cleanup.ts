import { BrowserManager } from './browser';
import { Log } from './log';
import { WeatherUpdateScheduler } from './scheduler';

/**
 * Clean up any instances that need to be cleaned up before application exits
 */
const cleanupAndExit = (): void => {
  Log.info('Exiting gracefully');
  WeatherUpdateScheduler.getInstance().cleanUpScheduler();
  BrowserManager.getInstance().cleanUpBrowser();
  process.exit();
};

/**
 * Register cleanup tasks upon exit
 */
export const registerCleanup = (): void => {
  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);
  process.on('SIGUSR1', cleanupAndExit);
  process.on('SIGUSR2', cleanupAndExit);
  process.on('exit', cleanupAndExit);
  process.on('uncaughtException', (err) => {
    Log.error('Uncaught Exception:', err);
    process.exitCode = 1;
    cleanupAndExit();
  });
};
