/**
 * Which major weather source is used.
 */
export enum WeatherSource {
  TheWeatherChannel,
  AccuWeather,
  NationalWeatherService,
}

/**
 * Short forecast status.
 */
export enum SkyStatus {
  Sunny,
  Cloudy,
  Rain,
  Storm,
}

/**
 * Indicates the level of verbosity for each log.
 */
export enum LogVerbosityLevel {
  Verbose,
  Info,
  Warning,
  Error,
}
