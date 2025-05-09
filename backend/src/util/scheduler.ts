import { ToadScheduler, SimpleIntervalJob, AsyncTask } from 'toad-scheduler';
import { fetchAllData } from './browser';
import { WeatherManager } from './weather';
import { Log } from './log';

/**
 * Singleton class to initialize and store the scheduler for updating the weather data
 */
export class WeatherUpdateScheduler {
  private static instance: WeatherUpdateScheduler;
  private scheduler: ToadScheduler;
  private job: SimpleIntervalJob;

  /**
   * Private constructor to prevent instantiation outside of the class
   */
  private constructor() {
    this.scheduler = new ToadScheduler();

    const updateWeatherDataTask = new AsyncTask(
      'Update Weather Data',
      async () => {
        Log.info('Scheduler is fetching all weather data');
        WeatherManager.getInstance().setCurrentReport(await fetchAllData());
        Log.info('Scheduler completed fetching all weather data');
      }
    );
    this.job = new SimpleIntervalJob(
      { hours: 1, runImmediately: true },
      updateWeatherDataTask
    );
    this.scheduler.addSimpleIntervalJob(this.job);
  }

  /**
   * Public method to get the singleton instance of the class
   */
  public static getInstance(): WeatherUpdateScheduler {
    if (!this.instance) {
      this.instance = new WeatherUpdateScheduler();
    }
    return this.instance;
  }

  /**
   * Stop the scheduler on app exit
   */
  public cleanUpScheduler(): void {
    this.scheduler.stop();
  }
}
