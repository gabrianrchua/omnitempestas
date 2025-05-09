import { SkyStatus, WeatherSource } from './enums';

/**
 * One weather entry for one point of time for one weather source.
 */
export interface WeatherEntry {
  /**
   * Which major weather source this data point came from.
   */
  source: WeatherSource;

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
  skyStatus: SkyStatus;

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

// #region NWS API call interfaces
interface Context {
  '@context': string[];
  '@version': string;
  wx: string;
  geo: string;
  unit: string;
  '@vocab': string;
}

interface Geometry {
  type: 'Polygon';
  coordinates: number[][][];
}

interface Elevation {
  unitCode: string;
  value: number;
}

interface Period {
  number: number;
  name?: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend?: string;
  probabilityOfPrecipitation: Probability;
  dewpoint: DewPoint;
  relativeHumidity: RelativeHumidity;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast?: string;
}

interface Probability {
  unitCode: string;
  value: number;
}

interface DewPoint {
  unitCode: string;
  value: number;
}

interface RelativeHumidity {
  unitCode: string;
  value: number;
}

interface Properties {
  units: string;
  forecastGenerator: string;
  generatedAt: string;
  updateTime: string;
  validTimes: string;
  elevation: Elevation;
  periods: Period[];
}

/**
 * The JSON format of an NWS api call as of 5/17/2025.
 */
export interface NWSData {
  '@context': Context['@context'];
  type: 'Feature';
  geometry: Geometry;
  properties: Properties;
}
// #endregion
