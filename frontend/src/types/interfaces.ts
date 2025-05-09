import { type SkyStatusType, type WeatherSourceType } from './enums';

/**
 * One weather entry for one point of time for one weather source.
 */
export interface WeatherEntry {
  /**
   * Which major weather source this data point came from.
   */
  source: WeatherSourceType;

  /**
   * The hours component of the time associated with this data source, in 24
   * hour format (0-23).
   */
  timeHours: number;

  /**
   * The minutes component of the time associated with this data source (0-59).
   */
  timeMinutes: number;

  /**
   * The rain percentage (0.0-100.0).
   */
  rainPercent: number;

  /**
   * The forecasted amount of rain, in inches.
   */
  rainAmount: number;

  /**
   * The short forecast status.
   */
  skyStatus: SkyStatusType;

  /**
   * The temperature, in Fahrenheit.
   */
  temperature: number;
}

/**
 * One weather report captured by multiple sources at a given time.
 */
export interface WeatherReport {
  /**
   * The entries in this weather report.
   */
  entries: WeatherEntry[];

  /**
   * The time this report was captured.
   */
  timestamp: Date;
}
