import { WeatherEntry, WeatherReport } from '../types/interfaces';

/**
 * Singleton that holds the current weather report for use by external clients.
 */
export class WeatherManager {
  private static instance: WeatherManager;
  private currentReport: WeatherReport | undefined;

  private constructor() {}

  public static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  public getCurrentReport(): WeatherReport | undefined {
    return this.currentReport;
  }

  public setCurrentReport(entries: WeatherEntry[]): void {
    this.currentReport = { timestamp: new Date(), entries };
  }
}
